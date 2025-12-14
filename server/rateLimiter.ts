interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_RATE_LIMIT_ENTRIES = 10000; // Prevent unbounded memory growth

const createRateLimiter = (maxRequests: number, windowMs: number, message: string) => {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = req.user?.claims?.sub;
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
      return next();
    }

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
  10,
  15 * 60 * 1000,
  "Too many authentication attempts. Please try again later."
);

export const passwordResetLimiter = createRateLimiter(
  3,
  60 * 60 * 1000,
  "Too many password reset requests. Please try again in an hour."
);

export const generationRateLimiter = createRateLimiter(
  30,
  60 * 1000,
  "Too many generation requests. Please wait a moment."
);

export const guestGenerationLimiter = createRateLimiter(
  5,
  60 * 60 * 1000,
  "Guest generation limit reached. Please sign in to continue."
);

export const adminRateLimiter = createRateLimiter(
  100,
  60 * 1000,
  "Too many admin requests. Please slow down."
);

// Cleanup every 10 seconds instead of 60 for more responsive memory management
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 1000);
