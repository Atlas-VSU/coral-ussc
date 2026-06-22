"use client"

import { useState, useMemo } from "react"
import type { ClearanceStatus } from "../types"
import { PaymentType } from "@/constants/types"

export function useManualPaymentSelection(clearance: ClearanceStatus | null) {
  const items = useMemo(() => {
    if (!clearance) return []
    return Object.entries(clearance.blockingItems)
      .filter(([_, item]) => item.status === "unpaid" && !item.pendingReview && item.isRequiredForClearance)
      .map(([refId, item]) => ({
        refId,
        label: item.title,
        amount: item.balance,
        type: item.type,
      }))
  }, [clearance])

  const [selectedRefIds, setSelectedRefIds] = useState<Set<string>>(new Set())

  const toggleItem = (refId: string) => {
    setSelectedRefIds(prev => {
      const next = new Set(prev)
      if (next.has(refId)) next.delete(refId)
      else next.add(refId)
      return next
    })
  }

  const toggleAll = () => {
    const allIds = items.map(i => i.refId)
    setSelectedRefIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds))
  }

  const selectedItems = items.filter(i => selectedRefIds.has(i.refId))
  const total = selectedItems.reduce((sum, i) => sum + i.amount, 0)

  return {
    items,
    selectedRefIds,
    selectedItems,
    total,
    toggleItem,
    toggleAll,
    clearSelection: () => setSelectedRefIds(new Set()),
  }
}