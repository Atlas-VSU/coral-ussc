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

        // 2. Determine the cursor for the current page
        // page 1 -> null cursor
        // page 2 -> cursor from end of page 1
        const cursor = currentPage > 1 ? lastVisibleDocs[currentPage - 2] : null

        // 3. Fetch paginated data
        const { docs, lastVisible } = await fetchClearanceDocumentsPaginated(
          orgId,
          pageSize,
          cursor,
          searchTerm,
          statusFilter
        )

        if (isMounted) {
          setClearances(docs)
          // Update the cursor for this page so we can go to next page
          if (lastVisible) {
            setLastVisibleDocs(prev => {
              const next = [...prev]
              next[currentPage - 1] = lastVisible
              return next
            })
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
