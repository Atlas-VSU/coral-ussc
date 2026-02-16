/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private DEFAULT_TTL = 60 * 60 * 1000; // 1 hour default TTL

  // Cache hit/miss metrics for performance monitoring
  private metrics = {
    hits: 0,
    misses: 0,
    byKey: new Map<string, { hits: number; misses: number }>(),
  };

  private constructor() {
    // Initialize from localStorage if available
    try {
      const savedCache = localStorage.getItem("app-data-cache");
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as CacheEntry<any>);
        });
      }
    } catch (error) {
      console.error("Failed to load cache from localStorage", error);
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries());
      localStorage.setItem("app-data-cache", JSON.stringify(cacheObject));
    } catch (error) {
      console.error("Failed to save cache to localStorage", error);
    }
  }

  // Get data from cache or fetch it
  public async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Check if we have valid cache
    const cached = this.cache.get(key);
    const now = Date.now();

    // Update metrics for this key
    if (!this.metrics.byKey.has(key)) {
      this.metrics.byKey.set(key, { hits: 0, misses: 0 });
    }
    const keyMetrics = this.metrics.byKey.get(key)!;

    if (cached && cached.expiresAt > now) {
      // Cache hit
      this.metrics.hits++;
      keyMetrics.hits++;
      console.log(`Cache hit for ${key}`);
      return cached.data as T;
    }

    // Cache miss
    this.metrics.misses++;
    keyMetrics.misses++;
    console.log(`Cache miss for ${key}, fetching data...`);
    const data = await fetchFn();

    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });

    this.saveToStorage();
    return data;
  }

  // Get data from cache without fetching - returns null if not found or expired
  public get<T>(key: string): CacheEntry<T> | null {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached as CacheEntry<T>;
    }

    return null;
  }

  // Manually set cache
  public set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
    this.saveToStorage();
  }

  // Invalidate specific cache entry
  public invalidate(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  // Invalidate cache entries by prefix
  public invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    this.saveToStorage();
  }

  // Clear entire cache
  public clear(): void {
    this.cache.clear();
    localStorage.removeItem("app-data-cache");
  }

  // Clear all application caches and local storage data
  public clearAllOnLogout(): void {
    // Clear the in-memory cache
    this.cache.clear();

    try {
      // Clear app-data-cache from localStorage
      localStorage.removeItem("app-data-cache");

      // Only preserve theme preference
      const preserveKeys = ["theme"];

      // Get all localStorage keys and remove non-preserved ones
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !preserveKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      }

      // Reset metrics
      this.metrics = {
        hits: 0,
        misses: 0,
        byKey: new Map(),
      };

      console.log("Cache service cleared all data during logout");
    } catch (error) {
      console.error("Error during cache clearing:", error);
      // Still attempt to clear the in-memory cache if localStorage fails
      this.cache.clear();
    }
  }

  // Extend TTL for frequently accessed cache items
  public extendTTL(key: string, additionalTime: number): void {
    const cached = this.cache.get(key);
    if (cached) {
      cached.expiresAt += additionalTime;
      this.saveToStorage();
    }
  }

  // Intelligently optimize cache based on access patterns
  public optimizeCache(): void {
    // Extend TTL for frequently accessed items
    for (const [key, metrics] of this.metrics.byKey.entries()) {
      if (
        metrics.hits > 10 &&
        metrics.hits / (metrics.hits + metrics.misses) > 0.8
      ) {
        // This is a frequently hit cache item, extend its TTL
        const cached = this.cache.get(key);
        if (cached) {
          const extensionTime = 30 * 60 * 1000; // 30 minutes
          cached.expiresAt = Math.max(
            cached.expiresAt,
            Date.now() + extensionTime
          );
        }
      }
    }

    this.saveToStorage();
  }

  // Get cache stats and metrics
  public getStats() {
    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
        : 0;

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalSizeKB: this.estimateCacheSizeKB(),
      metrics: {
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        hitRate: `${hitRate.toFixed(2)}%`,
      },
    };
  }

  private estimateCacheSizeKB(): number {
    try {
      const cacheString = JSON.stringify(
        Object.fromEntries(this.cache.entries())
      );
      return Math.round(cacheString.length / 1024);
    } catch (e) {
      return 0;
    }
  }
}

export const cacheService = CacheService.getInstance();

// Cache durations
export const CACHE_DURATIONS = {
  PROGRAMS: 24 * 60 * 60 * 1000, // 24 hours
  USERS: 60 * 60 * 1000, // 1 hour
  EVENTS: 15 * 60 * 1000, // 15 minutes
  ATTENDANCE: 5 * 60 * 1000, // 5 minutes
  SEARCH_RESULTS: 2 * 60 * 1000, // 2 minutes
  DASHBOARD: {
    STATS: 5 * 60 * 1000, // 5 minutes
    ONGOING_EVENTS: 60 * 1000, // 1 minute (since status changes frequently)
    UPCOMING_EVENTS: 15 * 60 * 1000, // 15 minutes
    RECENT_MEMBERS: 30 * 60 * 1000, // 30 minutes
  },
  UI_STATE: 30 * 1000, // 30 seconds for UI state
};
