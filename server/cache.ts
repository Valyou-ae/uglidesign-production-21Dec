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

// Statistics tracking
let cacheHits = 0;
let cacheMisses = 0;

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
    cacheHits++;
    return cached.data;
  }

  cacheMisses++;

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
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expires < now) {
      cache.delete(key);
    }
  }
}, 30 * 1000);

/**
 * Stop the cache cleanup interval (call during graceful shutdown)
 */
export function stopCacheCleanup(): void {
  clearInterval(cleanupInterval);
}

// Cache TTL constants
export const CACHE_TTL = {
  LEADERBOARD: 60 * 1000,       // 1 minute
  GALLERY_IMAGES: 5 * 60 * 1000, // 5 minutes
  ANALYTICS: 60 * 1000,          // 1 minute
  USER_STATS: 30 * 1000,         // 30 seconds
  IMAGE_BUFFER: 30 * 60 * 1000,  // 30 minutes for image buffers
} as const;

/**
 * LRU Image Buffer Cache
 * Stores decoded image buffers for fast serving
 * Uses memory-based eviction to prevent OOM
 */
interface ImageCacheEntry {
  buffer: Buffer;
  mimeType: string;
  lastAccess: number;
  size: number;
}

class ImageBufferCache {
  private cache = new Map<string, ImageCacheEntry>();
  private currentSize = 0;
  private readonly maxSizeBytes: number;
  private readonly maxEntries: number;

  constructor(maxSizeMB: number = 100, maxEntries: number = 500) {
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;
    this.maxEntries = maxEntries;
  }

  get(imageId: string): ImageCacheEntry | undefined {
    const entry = this.cache.get(imageId);
    if (entry) {
      // Update last access for LRU
      entry.lastAccess = Date.now();
      return entry;
    }
    return undefined;
  }

  set(imageId: string, buffer: Buffer, mimeType: string): void {
    const size = buffer.length;

    // Don't cache images larger than 10MB
    if (size > 10 * 1024 * 1024) {
      return;
    }

    // Evict if needed to make room
    while (
      (this.currentSize + size > this.maxSizeBytes || this.cache.size >= this.maxEntries) &&
      this.cache.size > 0
    ) {
      this.evictLRU();
    }

    // Remove existing entry if updating
    const existing = this.cache.get(imageId);
    if (existing) {
      this.currentSize -= existing.size;
    }

    this.cache.set(imageId, {
      buffer,
      mimeType,
      lastAccess: Date.now(),
      size,
    });
    this.currentSize += size;
  }

  private evictLRU(): void {
    let oldest: { key: string; time: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.lastAccess < oldest.time) {
        oldest = { key, time: entry.lastAccess };
      }
    }

    if (oldest) {
      const entry = this.cache.get(oldest.key);
      if (entry) {
        this.currentSize -= entry.size;
      }
      this.cache.delete(oldest.key);
    }
  }

  delete(imageId: string): void {
    const entry = this.cache.get(imageId);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(imageId);
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats(): { entries: number; sizeMB: number; maxSizeMB: number } {
    return {
      entries: this.cache.size,
      sizeMB: Math.round((this.currentSize / 1024 / 1024) * 100) / 100,
      maxSizeMB: this.maxSizeBytes / 1024 / 1024,
    };
  }
}

// Singleton image cache - default 100MB, 500 entries max
const imageCacheMaxMB = parseInt(process.env.IMAGE_CACHE_MAX_MB || '100');
export const imageCache = new ImageBufferCache(imageCacheMaxMB, 500);

/**
 * Get combined cache statistics for monitoring
 */
export function getCacheStats(): {
  general: { entries: number; maxEntries: number; hits: number; misses: number; hitRate: number };
  images: { entries: number; sizeMB: number; maxSizeMB: number };
} {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? Math.round((cacheHits / total) * 10000) / 100 : 0;
  
  return {
    general: {
      entries: cache.size,
      maxEntries: MAX_CACHE_ENTRIES,
      hits: cacheHits,
      misses: cacheMisses,
      hitRate,
    },
    images: imageCache.getStats(),
  };
}

/**
 * Get image from cache or decode from base64
 */
export function getCachedImageBuffer(
  imageId: string,
  base64DataUrl: string
): { buffer: Buffer; mimeType: string } | null {
  // Check cache first
  const cached = imageCache.get(imageId);
  if (cached) {
    return { buffer: cached.buffer, mimeType: cached.mimeType };
  }

  // Decode and cache
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Cache for future requests
  imageCache.set(imageId, buffer, mimeType);

  return { buffer, mimeType };
}
