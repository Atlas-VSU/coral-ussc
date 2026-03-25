"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { fetchClearanceDocumentsPaginated, getClearanceCount } from "@/firebase/clearance"
import { cacheService } from "@/services/cacheService"
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
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false) // Lock to prevent spam

  // Store cursors in a ref — NOT state — so updating them never triggers a re-render
  const cursorsRef = useRef<Record<number, any>>({})

  // 1. ISOLATE AND CACHE COUNTING
  const fetchCount = useCallback(async () => {
    if (!orgId) return

    const cacheKey = `clearance:count:${orgId}:${statusFilter}:${searchTerm}`
    const cached = cacheService.get(cacheKey)
    if (cached !== null && cached !== undefined) { 
      const countValue = typeof cached === 'object' && 'data' in (cached as any) 
        ? (cached as any).data 
        : cached;
      setTotalCount(countValue as any)
      return 
    }

    try {
      const count = await getClearanceCount(orgId, statusFilter, searchTerm)
      cacheService.set(cacheKey, count, 5 * 60 * 1000) 
      setTotalCount(count)
    } catch (err) {
      console.error("Error fetching clearance count:", err)
    }
  }, [orgId, statusFilter, searchTerm])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

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
        statusFilter
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
  }, [orgId, pageSize, searchTerm, statusFilter, currentPage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const hardRefresh = useCallback(async () => {
    if (!orgId || isRefreshing) return
    setIsRefreshing(true)

    try {
      cacheService.invalidateByPrefix('clearance:doc:')
      cacheService.invalidateByPrefix('clearance:all:')
      cacheService.invalidateByPrefix('clearance:count:')

      cursorsRef.current[currentPage - 1] = undefined

      await Promise.all([
        fetchData(),
        fetchCount()
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [orgId, isRefreshing, currentPage, fetchData, fetchCount])

  return { 
    clearances, 
    loading, 
    error, 
    totalCount, 
    hasNextPage,
    setClearances, 
    hardRefresh 
  }
}