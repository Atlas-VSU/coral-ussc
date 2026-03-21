/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from "firebase/firestore";
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  lastAccessedAt?: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private DEFAULT_TTL = 60 * 60 * 1000; // 1 hour default TTL
  private MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB threshold for localStorage
  private MAX_ENTRY_SIZE = 1 * 1024 * 1024; // 1MB threshold for individual entry persistence

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
          const entry = value as CacheEntry<any>;
          // Hydrate data if it contains timestamps
          entry.data = this.hydrateTimestamps(entry.data);
          // Set lastAccessedAt if missing
          if (!entry.lastAccessedAt) entry.lastAccessedAt = Date.now();
          this.cache.set(key, entry);
        });
      }
    } catch (error) {
      console.error("Failed to load cache from localStorage", error);
    }
  }

  // Helper to recursively hydrate Firestore Timestamps
  private hydrateTimestamps(data: any): any {
    if (data === null || data === undefined) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.hydrateTimestamps(item));
    }

    // Handle objects
    if (typeof data === "object") {
      // Check if this is a serialized Timestamp (Firestore JS SDK format)
      if (
        typeof data.seconds === "number" &&
        typeof data.nanoseconds === "number" &&
        typeof data.toDate !== "function"
      ) {
        return new Timestamp(data.seconds, data.nanoseconds);
      }

      // Check for _seconds/_nanoseconds (Firebase Admin or older SDKs)
      if (
        typeof data._seconds === "number" &&
        typeof data._nanoseconds === "number" &&
        typeof data.toDate !== "function"
      ) {
        return new Timestamp(data._seconds, data._nanoseconds);
      }

      // Recursively hydrate all properties
      const hydrated: any = {};
      for (const [key, value] of Object.entries(data)) {
        hydrated[key] = this.hydrateTimestamps(value);
      }
      return hydrated;
    }

    return data;
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Save cache to localStorage with size management
  private saveToStorage(): void {
    try {
      // 1. Prepare data for persistence
      const persistableCache: Record<string, CacheEntry<any>> = {};
      let projectedSize = 0;

      // Filter out expired and excessively large entries
      const entries = Array.from(this.cache.entries())
        .filter(([_, entry]) => entry.expiresAt > Date.now())
        .sort((a, b) => (b[1].lastAccessedAt || 0) - (a[1].lastAccessedAt || 0));

      for (const [key, entry] of entries) {
        const entryString = JSON.stringify(entry);
        
        // Skip individual entries that are too large (will remain in-memory only)
        if (entryString.length > this.MAX_ENTRY_SIZE) {
          console.warn(`[Cache] Entry "${key}" is too large (${Math.round(entryString.length / 1024)}KB) to persist. Remaining in memory only.`);
          continue;
        }

        if (projectedSize + entryString.length < this.MAX_STORAGE_SIZE) {
          persistableCache[key] = entry;
          projectedSize += entryString.length;
        } else {
          // Reached the limit of what we want to store in localStorage
          break;
        }
      }

      const jsonString = JSON.stringify(persistableCache);
      localStorage.setItem("app-data-cache", jsonString);
    } catch (error) {
      if (error instanceof Error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.error("[Cache] QuotaExceededError during save. Clearing old cache entries.");
        this.emergencyPurge();
      } else {
        console.error("Failed to save cache to localStorage", error);
      }
    }
  }

  // Emergency purge when storage is full
  private emergencyPurge(): void {
    try {
      // Clear half of the cache (the oldest entries)
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => (a[1].lastAccessedAt || 0) - (b[1].lastAccessedAt || 0));
      
      const toRemove = Math.ceil(entries.length / 2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
      
      // Try saving the smaller cache
      this.saveToStorage();
    } catch (e) {
      // If even that fails, clear everything to restore functionality
      console.error("[Cache] Emergency purge failed, clearing entire cache.");
      this.clear();
    }
  }

  // Get data from cache or fetch it
  public async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const startTime = performance.now();
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
      cached.lastAccessedAt = now; // Update access time
      this.metrics.hits++;
      keyMetrics.hits++;
      const duration = performance.now() - startTime;
      console.log(`%c[Cache Hit] %c${key} %c(${duration.toFixed(2)}ms)`, 'color: #4CAF50; font-weight: bold', 'color: #2196F3', 'color: #9E9E9E');
      return cached.data as T;
    }

    // Cache miss
    this.metrics.misses++;
    keyMetrics.misses++;
    console.log(`%c[Cache Miss] %c${key}`, 'color: #F44336; font-weight: bold', 'color: #2196F3');
    
    const data = await fetchFn();
    const duration = performance.now() - startTime;
    console.log(`%c[Cache Populated] %c${key} %c(Fetched in ${duration.toFixed(2)}ms)`, 'color: #FF9800; font-weight: bold', 'color: #2196F3', 'color: #9E9E9E');

    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      lastAccessedAt: now,
    });

    this.saveToStorage();
    return data;
  }

  // Get data from cache without fetching - returns null if not found or expired
  public get<T>(key: string): CacheEntry<T> | null {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      cached.lastAccessedAt = now;
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
      lastAccessedAt: now,
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

  /**
   * Updates a single item within a cached list without re-fetching the entire list.
   * @param key The cache key for the list
   * @param id The ID of the item to update
   * @param updater Function that takes the old item and returns the updated item
   */
  public updateInList<T extends { id?: string | number }>(
    key: string,
    id: string | number,
    updater: (item: T) => T
  ): void {
    const entry = this.get<T[]>(key);
    if (entry) {
      const updatedData = entry.data.map((item) =>
        (item.id === id || (item as any).uid === id) ? updater(item) : item
      );
      this.set(key, updatedData);
    }
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
  FEES: 20 * 60 * 1000, // 20 minutes
  FINES: 20 * 60 * 1000, // 20 minutes
  PAYMENTS: 10 * 60 * 1000, // 10 minutes (payments change more frequently)
  PAYMENT_HISTORY: 10 * 60 * 1000, // 10 minutes
  CLEARANCE: 10 * 60 * 1000, // 10 minutes
};

// Structured cache key helpers — use these everywhere instead of raw strings
export const CACHE_KEYS = {
  // Fees
  feesForOrg:   (orgId: string) => `fees:org:${orgId}`,
  feesUnpaid:   (orgId: string) => `fees:unpaid:${orgId}`,
  feeRoster:    (orgId: string, title: string, year: string) => `fees:roster:${orgId}:${title}:${year}`,
  feeDoc:       (feeId: string) => `fees:doc:${feeId}`,
  feeLogs:      (feeId: string) => `fees:logs:${feeId}`,

  // Fines
  finesAll:        (orgId: string) => `fines:all:${orgId}`,
  finesUnpaid:     (orgId: string) => `fines:unpaid:${orgId}`,
  fineByStudent:   (studentId: string) => `fines:student:${studentId}`,
  fineDoc:         (fineId: string) => `fines:doc:${fineId}`,
  fineItems:       (fineId: string) => `fines:items:${fineId}`,
  fineUnpaidItems: (fineId: string) => `fines:unpaiditems:${fineId}`,
  fineTypesAll:    (orgId: string) => `fines:types:all:${orgId}`,
  fineTypeDoc:     (id: string)    => `fines:types:doc:${id}`,
  finesBatch:      (hash: string)  => `fines:batch:${hash}`,

  // Payments (proof of payment)
  proofOfPayments:     (orgId: string) => `payments:proofs:${orgId}`,
  proofOfPayment:      (id: string)    => `payments:proof:${id}`,
  proofOfPaymentByUser: (userId: string, orgId: string) => `payments:proof:user:${userId}:${orgId}`,

  // Payment history
  paymentHistory:  (refId: string)               => `payments:history:${refId}`,
  verifiedHistory: (type: string, refId: string) => `payments:verified:${type}:${refId}`,

  // Fees
  feeCheckTitle: (orgId: string, title: string, year: string, sem: string) => `fees:checkTitle:${orgId}:${title}:${year}:${sem}`,

  // Clearance
  clearanceAll:   (orgId: string) => `clearance:all:${orgId}`,
  clearanceDoc:   (userId: string) => `clearance:doc:${userId}`,
  clearancePage:  (orgId: string, page: number, size: number, search: string, status: string) => 
    `clearance:page:${orgId}:${page}:${size}:${search}:${status}`,
  feeStatusForClearance: (userId: string, orgId: string) => `fees:statusForClearance:${userId}:${orgId}`,
};
