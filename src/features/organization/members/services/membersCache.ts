/* eslint-disable @typescript-eslint/no-unused-vars */
import { MemberData, Faculty, Program } from "../types";

interface MembersPageData {
  members: MemberData[];
  totalMembers: number;
  timestamp: number;
}

interface StaticDataCache {
  faculties: Faculty[] | null;
  programs: Program[] | null;
  lastFetch: number;
}

// Cache TTL values (in milliseconds)
export const STATIC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for static data
export const MEMBERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for member data

// Cache size limits
const MAX_CACHE_ENTRIES = 40; // Maximum number of pages to cache
const MAX_CACHE_SIZE_KB = 10000; // Maximum cache size (10MB)

const membersCache = new Map<string, MembersPageData>();

// Static data cache (faculties/programs)
let staticCache: StaticDataCache = {
  faculties: null,
  programs: null,
  lastFetch: 0,
};

// Initialize from localStorage if available
if (typeof window !== "undefined") {
  try {
    const storedStaticCache = localStorage.getItem("members-static-cache");
    if (storedStaticCache) {
      staticCache = JSON.parse(storedStaticCache);
    }
  } catch (error) {
    console.error("Failed to load static cache from localStorage", error);
  }

  try {
    // Load existing cache entries from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("members-data-")) {
        try {
          const cacheKey = key.replace("members-data-", "");
          const storedData = localStorage.getItem(key);
          if (storedData) {
            membersCache.set(cacheKey, JSON.parse(storedData));
          }
        } catch (innerError) {
          console.error(`Failed to parse cache for key: ${key}`, innerError);
        }
      }
    });
  } catch (error) {
    console.error(
      "Failed to initialize members cache from localStorage",
      error
    );
  }
}

// Initialize members cache from localStorage
try {
  // Load existing cache entries from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("members-data-")) {
      try {
        const cacheKey = key.replace("members-data-", "");
        const cacheData = JSON.parse(
          localStorage.getItem(key)!
        ) as MembersPageData;

        // Only add to memory if not expired
        if (Date.now() - cacheData.timestamp < MEMBERS_CACHE_TTL) {
          membersCache.set(cacheKey, cacheData);
        } else {
          // Clean up expired entries
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Ignore parsing errors for invalid cache entries
        localStorage.removeItem(key);
      }
    }
  });
} catch (error) {
  console.error("Failed to initialize members cache from localStorage", error);
}

// Generate cache key from query parameters
export const getCacheKey = (params: {
  page: number;
  pageSize: number;
  programFilter: string;
  searchQuery: string;
  sortBy: string;
}) => {
  return `${params.page}-${params.pageSize}-${params.programFilter}-${
    params.searchQuery || "none"
  }-${params.sortBy}`;
};

// Static data cache operations
export const getStaticCache = () => staticCache;

export const isStaticCacheValid = () => {
  return (
    staticCache.faculties !== null &&
    staticCache.programs !== null &&
    Date.now() - staticCache.lastFetch < STATIC_CACHE_TTL
  );
};

export const updateStaticCache = (
  faculties: Faculty[],
  programs: Program[]
) => {
  staticCache = {
    faculties,
    programs,
    lastFetch: Date.now(),
  };

  // Save to localStorage
  try {
    localStorage.setItem("members-static-cache", JSON.stringify(staticCache));
  } catch (error) {
    console.error("Failed to save static cache to localStorage", error);

    // If quota exceeded, clear some space
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldestCacheEntries(5);
      try {
        localStorage.setItem(
          "members-static-cache",
          JSON.stringify(staticCache)
        );
      } catch (e) {
        console.error(
          "Still failed to save static cache after clearing space",
          e
        );
      }
    }
  }
};

// Helper to clear oldest entries when needed
const clearOldestCacheEntries = (count: number) => {
  // Get all entries with timestamps
  const entries = Array.from(membersCache.entries())
    .map(([key, value]) => ({ key, timestamp: value.timestamp }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Delete the oldest 'count' entries or fewer if not enough entries
  const entriesToDelete = Math.min(count, entries.length);

  for (let i = 0; i < entriesToDelete; i++) {
    const key = entries[i].key;
    membersCache.delete(key);
    try {
      localStorage.removeItem(`members-data-${key}`);
    } catch (error) {
      console.error("Failed to remove cache entry from localStorage", error);
    }
  }

  return entriesToDelete;
};

// Check estimated cache size
const getEstimatedCacheSize = (): number => {
  let totalSize = 0;

  try {
    // Check members cache size
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("members-data-") || key === "members-static-cache") {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length * 2; // Approximate size in bytes (UTF-16 chars)
        }
      }
    });
  } catch (error) {
    console.error("Error calculating cache size", error);
  }

  return Math.floor(totalSize / 1024); // Convert to KB
};

// Enforce cache size limits
const enforceCacheLimits = () => {
  // Check if we have too many entries
  if (membersCache.size > MAX_CACHE_ENTRIES) {
    const entriesRemoved = clearOldestCacheEntries(
      membersCache.size - MAX_CACHE_ENTRIES
    );
    console.log(`Cache pruned: ${entriesRemoved} old entries removed`);
  }

  // Check total cache size
  const cacheSize = getEstimatedCacheSize();
  if (cacheSize > MAX_CACHE_SIZE_KB) {
    // Calculate how many entries to remove
    const percentToRemove = 0.3; // Remove 30% of entries when over limit
    const entriesToRemove = Math.ceil(membersCache.size * percentToRemove);
    clearOldestCacheEntries(entriesToRemove);
    console.log(
      `Cache size limit reached (${cacheSize}KB). Removed ${entriesToRemove} entries.`
    );
  }
};

// Members data cache operations
export const getMembersCacheEntry = (key: string) => {
  // First check in-memory cache
  if (membersCache.has(key)) {
    const entry = membersCache.get(key)!;

    // Check if still valid
    if (Date.now() - entry.timestamp < MEMBERS_CACHE_TTL) {
      return entry;
    } else {
      // Expired, remove it
      membersCache.delete(key);
      try {
        localStorage.removeItem(`members-data-${key}`);
      } catch (e) {
        // Ignore errors on removal
      }
      return null;
    }
  }

  // Then check localStorage
  try {
    const storedCache = localStorage.getItem(`members-data-${key}`);
    if (storedCache) {
      const parsedCache = JSON.parse(storedCache) as MembersPageData;

      // Check if cache is still valid
      if (Date.now() - parsedCache.timestamp < MEMBERS_CACHE_TTL) {
        // Restore to in-memory cache and return
        membersCache.set(key, parsedCache);
        return parsedCache;
      } else {
        // Expired, remove it
        localStorage.removeItem(`members-data-${key}`);
      }
    }
  } catch (error) {
    console.error("Failed to load members cache from localStorage", error);
    // Clean up potentially corrupted entry
    try {
      localStorage.removeItem(`members-data-${key}`);
    } catch (e) {
      // Ignore removal errors
    }
  }

  return null;
};

export const updateMembersCache = (
  key: string,
  members: MemberData[],
  totalMembers: number
) => {
  const cacheEntry: MembersPageData = {
    members,
    totalMembers,
    timestamp: Date.now(),
  };

  // Update in-memory cache
  membersCache.set(key, cacheEntry);

  // Enforce cache limits before saving
  enforceCacheLimits();

  // Save to localStorage
  try {
    localStorage.setItem(`members-data-${key}`, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error("Failed to save members cache to localStorage", error);

    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // Clear half of the oldest entries
      const entriesRemoved = clearOldestCacheEntries(
        Math.ceil(membersCache.size / 2)
      );
      console.log(
        `Storage quota exceeded. Removed ${entriesRemoved} cache entries.`
      );

      // Try again
      try {
        localStorage.setItem(`members-data-${key}`, JSON.stringify(cacheEntry));
      } catch (e) {
        console.error("Still failed to save cache after clearing space", e);
      }
    }
  }
};

export const clearMembersCache = () => {
  membersCache.clear();

  // Clear localStorage cache for members data
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("members-data-")) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear members cache from localStorage", error);
  }
};

// Get cache statistics for debugging/monitoring
export const getCacheStats = () => {
  const cacheSize = getEstimatedCacheSize();
  const entryCount = membersCache.size;

  return {
    cacheSize: `${cacheSize} KB`,
    entryCount,
    isNearLimit: cacheSize > MAX_CACHE_SIZE_KB * 0.8, // 80% of limit
  };
};

// Cache status utilities
export const getCacheStatus = (cacheKey: string) => {
  const cacheEntry = getMembersCacheEntry(cacheKey);
  if (!cacheEntry) return { isFromCache: false };

  const age = Math.round((Date.now() - cacheEntry.timestamp) / 1000);
  return {
    isFromCache: true,
    ageInSeconds: age,
    ageText: age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`,
  };
};

// Invalidate cache when data changes (add/edit/delete operations)
export const invalidateCache = () => {
  clearMembersCache();

  // Notify other tabs/windows about the change
  try {
    localStorage.setItem("members-cache-invalidation", Date.now().toString());
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Clears all user-specific data from localStorage and memory.
 * This should be called on user logout.
 */
export const clearAllCachesOnLogout = () => {
  // Clear the dynamic members cache
  clearMembersCache();

  // Clear the static cache for faculties and programs
  staticCache = {
    faculties: null,
    programs: null,
    lastFetch: 0,
  };
  try {
    localStorage.removeItem("members-static-cache");
  } catch (error) {
    console.error("Failed to clear static cache from localStorage", error);
  }

  console.log("All user-specific caches have been cleared.");
};

// Export cache debugging functions for dev tools
export const debugCache = {
  getCacheSize: getEstimatedCacheSize,
  getAllKeys: () => Array.from(membersCache.keys()),
  getEntryCount: () => membersCache.size,
  clearOldest: clearOldestCacheEntries,
  enforceLimits: enforceCacheLimits,
};
