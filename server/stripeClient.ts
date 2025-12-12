import Stripe from 'stripe';

let stripeAvailable = false;
let cachedCredentials: { publishableKey: string; secretKey: string } | null = null;

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string } | null> {
  // Always refresh from env vars on each call to pick up secret changes
  // First check environment variables (secrets)
  const envPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const envSecretKey = process.env.STRIPE_SECRET_KEY;

  if (envPublishableKey && envSecretKey) {
    stripeAvailable = true;
    cachedCredentials = {
      publishableKey: envPublishableKey,
      secretKey: envSecretKey,
    };
    return cachedCredentials;
  }

  // Fall back to Replit connector if env vars not set
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  try {
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set('include_secrets', 'true');
    url.searchParams.set('connector_names', connectorName);
    url.searchParams.set('environment', targetEnvironment);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    const data = await response.json();
    
    const connectionSettings = data.items?.[0];

    if (!connectionSettings || (!connectionSettings.settings?.publishable || !connectionSettings.settings?.secret)) {
      return null;
    }

    stripeAvailable = true;
    cachedCredentials = {
      publishableKey: connectionSettings.settings.publishable,
      secretKey: connectionSettings.settings.secret,
    };
    return cachedCredentials;
  } catch {
    return null;
  }
}

export function isStripeConfigured(): boolean {
  return stripeAvailable;
}

export async function getUncachableStripeClient(): Promise<Stripe | null> {
  const credentials = await getCredentials();
  if (!credentials) return null;

  return new Stripe(credentials.secretKey);
}

export async function getStripePublishableKey(): Promise<string | null> {
  const credentials = await getCredentials();
  return credentials?.publishableKey ?? null;
}

export async function getStripeSecretKey(): Promise<string | null> {
  const credentials = await getCredentials();
  return credentials?.secretKey ?? null;
}

let stripeSync: any = null;

export async function getStripeSync(): Promise<any | null> {
  if (!stripeSync) {
    const secretKey = await getStripeSecretKey();
    if (!secretKey) return null;

    const { StripeSync } = await import('stripe-replit-sync');

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
