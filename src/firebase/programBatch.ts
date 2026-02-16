import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase.config";
import { Program } from "@/features/organization/members/types";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";

/**
 * Fetches multiple programs in a single batch to minimize Firestore reads
 * @param programIds Array of program IDs to fetch
 * @returns Object mapping program IDs to their data
 */
export const batchGetPrograms = async (
  programIds: string[]
): Promise<Record<string, Program>> => {
  if (!programIds.length) return {};

  // Remove duplicates
  const uniqueIds = [...new Set(programIds)];

  // Create cache key based on the sorted list of IDs
  const cacheKey = `programs-batch:${uniqueIds.sort().join(",")}`;

  return await cacheService.getOrFetch<Record<string, Program>>(
    cacheKey,
    async () => {
      console.log(`🔍 Fetching ${uniqueIds.length} programs from Firestore`);

      // Results object
      const results: Record<string, Program> = {};

      // Firestore "in" queries are limited to 10 values
      const batchSize = 10;
      const programsCollection = collection(db, "programs");

      // Process in batches
      for (let i = 0; i < uniqueIds.length; i += batchSize) {
        const batch = uniqueIds.slice(i, i + batchSize);

        // Create query for this batch
        const q = query(programsCollection, where("__name__", "in", batch));

        // Execute query
        const snapshot = await getDocs(q);

        // Add results to our map
        snapshot.docs.forEach((doc) => {
          results[doc.id] = {
            id: doc.id,
            ...doc.data(),
          } as Program;
        });
      }

      return results;
    },
    CACHE_DURATIONS.PROGRAMS
  );
};

// Export a simple utility to check if we have all programs in our results
export const getMissingProgramIds = (
  programIds: string[],
  programsMap: Record<string, Program>
): string[] => {
  return programIds.filter((id) => !programsMap[id]);
};
