import { PaymentType } from "@/constants/types"
import type { BlockingItem } from "../types" // Adjust path to your actual types

export type ItemStatus = "cleared" | "pending" | "not-cleared"

export interface DisplayItem {
  label: string
  amount?: number
  status: ItemStatus
  pendingPayment?: boolean
  referenceId: string
}

export interface RequirementGroup {
  name: string
  status: ItemStatus
  items: DisplayItem[]
}

export function buildRequirementGroups(blockingItems: Record<string, BlockingItem>): RequirementGroup[] {
  const groups: Record<string, DisplayItem[]> = {
    "Fees": [],
    "Fines": [],
  }

  Object.entries(blockingItems).forEach(([id, item]) => {
    const groupName = item.type === PaymentType.FEES ? "Fees" : "Fines";
    const status: ItemStatus = item.status === "paid" 
      ? "cleared" 
      : item.pendingReview 
        ? "pending" 
        : "not-cleared"
        
    groups[groupName].push({
      label: item.title,
      amount: item.balance,
      status,
      pendingPayment: item.pendingReview,
      referenceId: id,
    })
  })

  return Object.entries(groups).map(([name, items]) => {
    const allCleared = items.every(i => i.status === "cleared")
    const anyNotCleared = items.some(i => i.status === "not-cleared")
    const anyPending = items.some(i => i.status === "pending")
    const groupStatus: ItemStatus = allCleared 
      ? "cleared" 
      : anyNotCleared 
        ? "not-cleared" 
        : anyPending 
          ? "pending" 
          : "cleared"
          
    return { name, status: groupStatus, items }
  })
}