"use client"

import { useState, useEffect } from "react"
import { fetchClearanceDocumentsPaginated, getClearanceCount } from "@/firebase/clearance"
import { cacheService, CACHE_KEYS } from "@/services/cacheService"
import type { ClearanceStatus } from "../types"

export function useClearances(
  orgId: string | undefined,
  pageSize: number = 10,
  searchTerm: string = "",
  statusFilter: string = "all",
  currentPage: number = 1
) {
  const [clearances, setClearances] = useState<ClearanceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<any[]>([]) // Store cursors for each page

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)

    const fetchData = async () => {
      try {
        // 1. Get total count for pagination UI
        const count = await getClearanceCount(orgId, statusFilter, searchTerm)
        if (isMounted) setTotalCount(count)

        // 2. Determine if we need to "jump" (fetch from start because we lack a cursor)
        const isJump = currentPage > 1 && !lastVisibleDocs[currentPage - 2];
        const effectivePageSize = isJump ? (currentPage * pageSize) : pageSize;
        const effectiveCursor = isJump ? null : (currentPage > 1 ? lastVisibleDocs[currentPage - 2] : null);

        // 3. Fetch paginated data
        const { docs: fetchedDocs, lastVisible, allSnapshots } = await fetchClearanceDocumentsPaginated(
          orgId,
          effectivePageSize,
          effectiveCursor,
          searchTerm,
          statusFilter
        )

        if (isMounted) {
          // If jumping, slice the results to get only the current page
          const displayDocs = isJump ? fetchedDocs.slice((currentPage - 1) * pageSize) : fetchedDocs;
          setClearances(displayDocs)

          // 4. Update cursors for all pages we just fetched/passed
          if (allSnapshots && allSnapshots.length > 0) {
            setLastVisibleDocs(prev => {
              const next = [...prev];
              allSnapshots.forEach((snap, index) => {
                // Calculate the absolute position in the full result set
                const absoluteIndex = isJump ? index : ((currentPage - 1) * pageSize + index);
                
                // If this is the end of a page, store it as the cursor for the NEXT page
                if ((absoluteIndex + 1) % pageSize === 0) {
                  const pageNum = (absoluteIndex + 1) / pageSize;
                  next[pageNum - 1] = snap;
                }
              });
              
              // Ensure the last document is always stored as the cursor for its corresponding page
              const finalAbsoluteIndex = isJump ? (allSnapshots.length - 1) : ((currentPage - 1) * pageSize + allSnapshots.length - 1);
              const finalPageNum = Math.ceil((finalAbsoluteIndex + 1) / pageSize);
              next[finalPageNum - 1] = allSnapshots[allSnapshots.length - 1];
              
              return next;
            });
          }
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching clearances:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch clearances"))
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [orgId, pageSize, searchTerm, statusFilter, currentPage])

  const hardRefresh = async () => {
    if (!orgId) return
    setLoading(true)
    // Clear relevant caches before refetching
    cacheService.invalidateByPrefix('clearance:doc:');
    cacheService.invalidateByPrefix('clearance:all:');
    try {
      const { docs } = await fetchClearanceDocumentsPaginated(
        orgId,
        pageSize,
        null,
        searchTerm,
        statusFilter
      )
      setClearances(docs)
      const count = await getClearanceCount(orgId, statusFilter, searchTerm)
      setTotalCount(count)
    } finally {
      setLoading(false)
    }
  }

  return { clearances, loading, error, totalCount, setClearances, hardRefresh }
}
