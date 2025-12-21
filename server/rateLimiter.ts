import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthenticatedRequest } from "./types";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Configurable limits via environment variables
const RATE_LIMITS = {
  // Generation limits per minute
  GENERATION_AUTH: parseInt(process.env.RATE_LIMIT_GENERATION_AUTH || '60'),     // 60/min for authenticated users
  GENERATION_GUEST: parseInt(process.env.RATE_LIMIT_GENERATION_GUEST || '10'),   // 10/hour for guests
  // API limits
  API_GENERAL: parseInt(process.env.RATE_LIMIT_API_GENERAL || '200'),            // 200/min for general API
  API_ADMIN: parseInt(process.env.RATE_LIMIT_API_ADMIN || '200'),                // 200/min for admin
  // Auth limits
  AUTH_ATTEMPTS: parseInt(process.env.RATE_LIMIT_AUTH || '20'),                  // 20 attempts per 15 min
  PASSWORD_RESET: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET || '5'),        // 5 per hour
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_RATE_LIMIT_ENTRIES = 50000; // Increased for higher concurrent users

const createRateLimiter = (maxRequests: number, windowMs: number, message: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const userId = (req as AuthenticatedRequest).user?.claims?.sub;
    const key = userId ? `user:${userId}` : `ip:${ip}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Enforce max size to prevent memory exhaustion
    if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES && !entry) {
      // Evict oldest 10% of entries
      const sortedEntries = Array.from(rateLimitStore.entries())
        .sort((a, b) => a[1].resetTime - b[1].resetTime);
      const evictCount = Math.floor(MAX_RATE_LIMIT_ENTRIES * 0.1);
      for (let i = 0; i < evictCount && i < sortedEntries.length; i++) {
        rateLimitStore.delete(sortedEntries[i][0]);
      }
    }

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      // Add rate limit headers for client awareness
      res.set({
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(maxRequests - 1),
        'X-RateLimit-Reset': String(Math.ceil((now + windowMs) / 1000)),
      });
      return next();
    }

    const remaining = maxRequests - entry.count;
    res.set({
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(Math.max(0, remaining - 1)),
      'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
    });

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        message,
        retryAfter
      });
    }

    entry.count++;
    next();
  };
};

export const authRateLimiter = createRateLimiter(
  RATE_LIMITS.AUTH_ATTEMPTS,
  15 * 60 * 1000,
  "Too many authentication attempts. Please try again later."
);

export const passwordResetLimiter = createRateLimiter(
  RATE_LIMITS.PASSWORD_RESET,
  60 * 60 * 1000,
  "Too many password reset requests. Please try again in an hour."
);

export const generationRateLimiter = createRateLimiter(
  RATE_LIMITS.GENERATION_AUTH,
  60 * 1000,
  "Too many generation requests. Please wait a moment."
);

export const guestGenerationLimiter = createRateLimiter(
  RATE_LIMITS.GENERATION_GUEST,
  60 * 60 * 1000,
  "Guest generation limit reached. Please sign in to continue."
);

export const adminRateLimiter = createRateLimiter(
  RATE_LIMITS.API_ADMIN,
  60 * 1000,
  "Too many admin requests. Please slow down."
);

// General API rate limiter for non-auth endpoints
export const apiRateLimiter = createRateLimiter(
  RATE_LIMITS.API_GENERAL,
  60 * 1000,
  "Too many requests. Please slow down."
);

// Export rate limits for monitoring
export function getRateLimitConfig() {
  return { ...RATE_LIMITS };
}

// Cleanup every 10 seconds instead of 60 for more responsive memory management
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 1000);

/**
 * Stop the rate limiter cleanup interval (call during graceful shutdown)
 */
export function stopRateLimiterCleanup(): void {
  clearInterval(cleanupInterval);
}
