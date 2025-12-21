import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export async function registerBillingRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, requireAdmin, getUserId } = middleware;

  // ============== STRIPE BILLING ROUTES ==============

  app.get("/api/stripe/config", async (_req: Request, res: Response) => {
    try {
      const { getStripePublishableKey } = await import("../stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      logger.error("Stripe config error", error, { source: "billing" });
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  app.get("/api/stripe/products", requireAuth, async (_req: Request, res: Response) => {
    try {
      const { stripeService } = await import("../stripeService");
      let products = await stripeService.listProductsWithPrices(true);

      if (products.length === 0) {
        await stripeService.syncProductsFromStripe();
        products = await stripeService.listProductsWithPrices(true);
      }

      res.json({ products });
    } catch (error) {
      logger.error("Stripe products error", error, { source: "billing" });
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.post("/api/stripe/sync-products", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { stripeService } = await import("../stripeService");
      const result = await stripeService.syncProductsFromStripe();
      res.json({ success: true, ...result });
    } catch (error) {
      logger.error("Stripe sync error", error, { source: "billing" });
      res.status(500).json({ message: "Failed to sync products" });
    }
  });

  app.post("/api/stripe/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { priceId, mode } = req.body;

      if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
        return res.status(400).json({ message: "Valid Price ID is required (must start with 'price_')" });
      }

      const validModes = ['subscription', 'payment'];
      const checkoutMode = validModes.includes(mode) ? mode : 'subscription';

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { stripeService } = await import("../stripeService");

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || '', userId);
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      const baseUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/billing?success=true`,
        `${baseUrl}/billing?canceled=true`,
        checkoutMode as 'subscription' | 'payment'
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      logger.error("Stripe checkout error", error, { source: "billing" });
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/create-portal-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found. Please subscribe first." });
      }

      const { stripeService } = await import("../stripeService");

      const baseUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/billing`
      );

      res.json({ url: session.url });
    } catch (error) {
      logger.error("Stripe portal error", error, { source: "billing" });
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.get("/api/stripe/subscription-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeCustomerId) {
        return res.json({
          hasSubscription: false,
          subscription: null,
          plan: 'free'
        });
      }

      const { getUncachableStripeClient } = await import("../stripeClient");
      const stripe = await getUncachableStripeClient();

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        if (user.stripeSubscriptionId) {
          await storage.updateStripeSubscriptionId(userId, null);
        }
        return res.json({
          hasSubscription: false,
          subscription: null,
          plan: 'free'
        });
      }

      const subscription = subscriptions.data[0];

      if (user.stripeSubscriptionId !== subscription.id) {
        await storage.updateStripeSubscriptionId(userId, subscription.id);
      }

      const planName = subscription.items.data[0]?.price?.product;
      let plan = 'pro';
      if (typeof planName === 'object' && planName !== null && 'name' in planName) {
        plan = (planName.name as string).toLowerCase().includes('business') ? 'business' : 'pro';
      }

      res.json({
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: (subscription as { current_period_end?: number }).current_period_end,
          current_period_start: (subscription as { current_period_start?: number }).current_period_start,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        plan
      });
    } catch (error) {
      logger.error("Stripe subscription status error", error, { source: "billing" });
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });
}
