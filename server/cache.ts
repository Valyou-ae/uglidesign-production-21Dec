/**
 * Simple in-memory cache with TTL for expensive queries
 * Helps reduce database load under concurrent traffic
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 1000;

/**
 * Get data from cache or fetch it using the provided function
 */
export async function getFromCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expires > now) {
    return cached.data;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Enforce max size
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Delete oldest 10% of entries
    const sortedKeys = Array.from(cache.entries())
      .sort((a, b) => a[1].expires - b[1].expires)
      .slice(0, Math.floor(MAX_CACHE_ENTRIES * 0.1))
      .map(([k]) => k);

    for (const k of sortedKeys) {
      cache.delete(k);
    }
  }

  cache.set(key, { data, expires: now + ttlMs });
  return data;
}

/**
 * Invalidate a specific cache key
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  cache.clear();
}

// Cleanup expired entries every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expires < now) {
      cache.delete(key);
    }
  }
}, 30 * 1000);

// Cache TTL constants
export const CACHE_TTL = {
  LEADERBOARD: 60 * 1000,       // 1 minute
  GALLERY_IMAGES: 5 * 60 * 1000, // 5 minutes
  ANALYTICS: 60 * 1000,          // 1 minute
  USER_STATS: 30 * 1000,         // 30 seconds
} as const;
