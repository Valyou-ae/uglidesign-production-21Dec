import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './logger';
import { pool } from './db';
import * as Sentry from '@sentry/node';

// ============== SENTRY ERROR MONITORING ==============
// Initialize Sentry early for comprehensive error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring sample rate (0.0 to 1.0)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Only send errors in production by default
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',

    // Don't send PII
    sendDefaultPii: false,

    // Ignore common non-actionable errors
    ignoreErrors: [
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'socket hang up',
    ],

    beforeSend(event) {
      // Scrub sensitive data from error reports
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
  logger.info('Sentry error monitoring initialized', { source: 'sentry' });
} else if (process.env.NODE_ENV === 'production') {
  logger.warn('SENTRY_DSN not configured - error monitoring disabled', { source: 'sentry' });
}

// ============== ENVIRONMENT VALIDATION ==============
interface EnvValidation {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  message?: string;
}

const ENV_VALIDATIONS: EnvValidation[] = [
  // Critical - app won't function without these
  { name: 'DATABASE_URL', required: true, message: 'Database connection required' },
  { name: 'SESSION_SECRET', required: process.env.NODE_ENV === 'production', message: 'Session secret required in production' },

  // Payment processing
  { name: 'STRIPE_SECRET_KEY', required: false, message: 'Stripe payments disabled' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: false, message: 'Stripe webhooks disabled' },

  // Image generation
  {
    name: 'GEMINI_API_KEY',
    required: false,
    validator: () => !!(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || process.env.AI_INTEGRATIONS_GEMINI_API_KEY),
    message: 'No Gemini API key configured - image generation will fail'
  },

  // Background removal
  { name: 'REPLICATE_API_TOKEN', required: false, message: 'Background removal feature disabled' },
];

function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const env of ENV_VALIDATIONS) {
    const value = process.env[env.name];
    const isValid = env.validator ? env.validator(value || '') : !!value;

    if (!isValid) {
      if (env.required) {
        errors.push(`Missing required env var: ${env.name} - ${env.message || 'Required for app to function'}`);
      } else {
        warnings.push(`Optional env var not set: ${env.name} - ${env.message || 'Feature may be disabled'}`);
      }
    }
  }

  // Log warnings
  for (const warning of warnings) {
    logger.warn(warning, { source: 'env-validation' });
  }

  // Fail on errors
  if (errors.length > 0) {
    for (const error of errors) {
      logger.error(error, undefined, { source: 'env-validation' });
    }
    throw new Error(`Environment validation failed: ${errors.length} required variable(s) missing`);
  }

  logger.info('Environment validation passed', { source: 'env-validation' });
}

// Validate environment before proceeding
validateEnvironment();

const app = express();
const httpServer = createServer(app);

// Production HTTP timeout configuration
httpServer.setTimeout(30000);           // 30s socket timeout
httpServer.keepAliveTimeout = 65000;    // Keep-alive timeout (> ALB default of 60s)
httpServer.headersTimeout = 66000;      // Must be > keepAliveTimeout

const stripeLogger = logger.child({ source: 'stripe' });

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  logger.info(message, { source });
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    stripeLogger.warn('DATABASE_URL not found, skipping Stripe init');
    return;
  }

  try {
    stripeLogger.info('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl
    });
    stripeLogger.info('Stripe schema ready');

    // Verify Stripe credentials work
    const { getUncachableStripeClient } = await import('./stripeClient');
    const stripe = await getUncachableStripeClient();
    
    if (!stripe) {
      stripeLogger.warn('Stripe not configured, skipping webhook setup');
      return;
    }

    // Test the connection by fetching account info
    const account = await stripe.accounts.retrieve();
    stripeLogger.info('Stripe connected successfully', { 
      accountId: account.id?.slice(0, 10) + '***'
    });

  } catch (error: any) {
    stripeLogger.warn('Stripe initialization issue', { reason: error?.message });
  }
}

(async () => {
  await initStripe();

  // CORS Configuration
  // Supports: ALLOWED_ORIGINS (comma-separated), REPLIT_DOMAINS, and localhost for dev
  const allowedOrigins = [
    // Production domains from env var (comma-separated, e.g., "https://myapp.com,https://www.myapp.com")
    ...(process.env.ALLOWED_ORIGINS?.split(',').map(d => d.trim()).filter(Boolean) || []),
    // Replit deployment domains
    ...(process.env.REPLIT_DOMAINS?.split(',').map(d => `https://${d}`) || []),
    // Development
    'http://localhost:5000',
    'http://localhost:3000',
    // OAuth providers
    'https://accounts.google.com',
  ];

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length <= 3) {
    logger.warn('No production ALLOWED_ORIGINS configured. Set ALLOWED_ORIGINS env var for production.', { source: 'cors' });
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.some(allowed => origin.startsWith(allowed) || allowed === origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      logger.warn('CORS blocked request', { origin, source: 'cors' });
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    maxAge: 86400,
  }));

  // Stripe webhook must be before body parsers
  app.post(
    '/api/stripe/webhook/:uuid',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }

      try {
        const sig = Array.isArray(signature) ? signature[0] : signature;

        if (!Buffer.isBuffer(req.body)) {
          stripeLogger.error('Webhook error: req.body is not a Buffer');
          return res.status(500).json({ error: 'Webhook processing error' });
        }

        const { uuid } = req.params;
        await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

        res.status(200).json({ received: true });
      } catch (error: any) {
        stripeLogger.error('Webhook processing error', error);
        res.status(400).json({ error: 'Webhook processing error' });
      }
    }
  );

  // Trust proxy for load balancer setups (AWS ALB, Nginx, Cloudflare, etc.)
  // This ensures correct client IP detection and secure cookie handling behind reverse proxies
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Trust first proxy
  }

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://accounts.google.com", "https://js.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // HSTS - enforce HTTPS in production
    strictTransportSecurity: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }));

  app.use(
    express.json({
      limit: '15mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false, limit: '15mb' }));

  // Disable ETags for API routes to prevent 304 responses with empty bodies
  // This fixes production issues where browser caching breaks JSON parsing
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    // Disable ETag generation for API responses
    app.set('etag', false);
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        logger.http(req.method, path, res.statusCode, duration);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  // Global error handler with Sentry integration
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Capture error in Sentry (only 5xx errors to reduce noise)
    if (status >= 500 && process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('status_code', status);
        scope.setContext('request', {
          method: req.method,
          url: req.url,
          query: req.query,
        });
        Sentry.captureException(err);
      });
    }

    logger.error('Unhandled error', err, { source: 'express', status });

    const message = process.env.NODE_ENV === 'production'
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // Graceful shutdown handler
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received, starting graceful shutdown...`, { source: 'shutdown' });

    // Stop accepting new connections
    httpServer.close(async () => {
      logger.info('HTTP server closed', { source: 'shutdown' });

      try {
        // Close database connection pool
        await pool.end();
        logger.info('Database pool closed', { source: 'shutdown' });
      } catch (error) {
        logger.error('Error closing database pool', error as Error, { source: 'shutdown' });
      }

      process.exit(0);
    });

    // Force shutdown after 30 seconds if graceful shutdown fails
    setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit', undefined, { source: 'shutdown' });
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
