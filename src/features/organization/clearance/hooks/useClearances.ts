"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { fetchClearanceDocumentsPaginated, fetchStats, getClearanceCount } from "@/firebase/clearance"
import { cacheService, CACHE_KEYS } from "@/services/cacheService"
import type { ClearanceStatus } from "../types"
import { useTermPeriod } from "../../term/hooks/useTermPeriod"

export function useClearances(
  orgId: string | undefined,
  pageSize: number = 9,
  searchTerm: string = "",
  statusFilter: string = "all",
  currentPage: number = 1
) {
  const [stats, setStats] = useState<{ cleared: number; not_cleared: number; pending: number }>({
    cleared: 0,
    not_cleared: 0,
    pending: 0,
  })
  const [clearances, setClearances] = useState<ClearanceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false) // Lock to prevent spam

  const { selected } = useTermPeriod()

  // Store cursors in a ref — NOT state — so updating them never triggers a re-render
  const cursorsRef = useRef<Record<number, any>>({})

  // 1. ISOLATE AND CACHE COUNTING
  const fetchCount = useCallback(async () => {
    if (!orgId) return

    try {
      const count = await getClearanceCount(orgId, statusFilter, searchTerm, selected)
      setTotalCount(count)
    } catch (err) {
      console.error("Error fetching clearance count:", err)
    }
  }, [orgId, statusFilter, searchTerm, selected])

  

  const fetchStatsData = useCallback(async () => {
    if (!orgId) return

    try {
      const data = await fetchStats(orgId, selected)
      if (data) {
        setStats(data)
      }
    } catch (err) {
      console.error("Error fetching clearance stats:", err)
    }
  }, [orgId, selected])

  const fetchData = useCallback(async () => {
    if (!orgId) return

    setLoading(true)
    setError(null)

    try {
      const cursor = currentPage > 1
        ? (cursorsRef.current[currentPage - 2] ?? null)
        : null

      const { docs, lastVisible } = await fetchClearanceDocumentsPaginated(
        orgId,
        pageSize,
        cursor,
        searchTerm,
        statusFilter,
        false,
        false,
        selected
      )

      setClearances(docs as ClearanceStatus[])
      setHasNextPage(docs.length === pageSize)

      if (lastVisible) {
        cursorsRef.current[currentPage - 1] = lastVisible
      }

    } catch (err) {
      console.error("Error fetching clearances:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch clearances"))
    } finally {
      setLoading(false)
    }
  }, [orgId, pageSize, searchTerm, statusFilter, currentPage, selected])

  useEffect(() => {
    const init = async () => {
      await fetchData()
      await fetchStatsData()
      await fetchCount()
    }
    init()
  }, [fetchData, fetchStatsData, fetchCount])

  const hardRefresh = useCallback(async () => {
    if (!orgId || isRefreshing) return
    setIsRefreshing(true)

    try {
      // Invalidate all clearance-related cache slices.
      // Keys written by clearance.ts include the term already (via buildClearanceId or
      // query-level term scoping), so prefix invalidation covers all terms at once.
      cacheService.invalidateByPrefix('clearance:doc:')
      cacheService.invalidateByPrefix('clearance:count:')
      cacheService.invalidateByPrefix('clearance:stats:')
      // 'clearance:all:' and 'clearance_stats_*' are legacy/unused prefixes — removed.

      cursorsRef.current[currentPage - 1] = undefined

      await Promise.all([
        fetchData(),
        fetchCount(),
        fetchStatsData()
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [orgId, isRefreshing, currentPage, fetchData, fetchCount, fetchStatsData])

  return { 
    clearances, 
    loading, 
    error, 
    totalCount, 
    hasNextPage,
    setClearances, 
    hardRefresh,
    stats,
    fetchStatsData,
    AY: selected?.AY || "",
    sem: selected?.semester || "",
  }
}