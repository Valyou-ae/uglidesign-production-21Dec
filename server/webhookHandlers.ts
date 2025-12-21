import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';
import { logger } from './logger';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // First, let stripe-replit-sync process the webhook (this verifies the signature internally)
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);

    // Then handle commission tracking for completed payments
    // The signature has been verified by stripe-replit-sync above, so we can trust the payload
    try {
      await WebhookHandlers.handleCommissionTracking(payload, signature);
    } catch (error) {
      logger.error('Commission tracking error', error, { source: 'webhook' });
      // Don't throw - we don't want to fail the webhook for commission errors
    }
  }

  static async handleCommissionTracking(payload: Buffer, signature: string): Promise<void> {
    // Use Stripe SDK to verify and construct the event
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      logger.info('Commission: Stripe not configured', { source: 'webhook' });
      return;
    }

    // Require webhook secret for security - without it we cannot verify the webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('Commission: STRIPE_WEBHOOK_SECRET not configured, skipping commission tracking for security', null, { source: 'webhook' });
      return;
    }
    
    let event: Stripe.Event;
    
    // Verify the webhook signature
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      logger.error('Commission: Webhook signature verification failed', err, { source: 'webhook' });
      return;
    }
    
    // Only process checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (!session) return;

    const sessionId = session.id;
    const customerId = session.customer as string;
    const amountTotal = session.amount_total; // Amount in cents

    if (!sessionId || !customerId || !amountTotal || amountTotal <= 0) {
      return;
    }

    // Check for idempotency - if we already processed this session, skip
    const existingCommission = await storage.getCommissionByStripeSessionId(sessionId);
    if (existingCommission) {
      logger.info(`Commission: Already processed session ${sessionId}`, { source: 'webhook' });
      return;
    }

    // Find the user who made the purchase by their Stripe customer ID
    const buyer = await storage.getUserByStripeCustomerId(customerId);
    if (!buyer) {
      logger.info(`Commission: No user found for customer ${customerId}`, { source: 'webhook' });
      return;
    }

    // Check if this user was referred
    if (!buyer.referredBy) {
      logger.info(`Commission: User has no referrer ${buyer.id}`, { source: 'webhook' });
      return;
    }

    // Calculate 20% commission using integer arithmetic to avoid floating-point errors
    // Formula: (amountTotal * 20) / 100 with proper rounding
    const commissionAmount = Math.trunc((amountTotal * 20 + 50) / 100);
    
    if (commissionAmount <= 0) {
      return;
    }

    // Create the commission record with session ID for idempotency (storing as cents for precision)
    await storage.createCommission(buyer.referredBy, buyer.id, commissionAmount, sessionId);
    
    logger.info(`Commission created: ${commissionAmount} cents for referrer ${buyer.referredBy} from buyer ${buyer.id} (session: ${sessionId})`, { source: 'webhook' });
  }
}
