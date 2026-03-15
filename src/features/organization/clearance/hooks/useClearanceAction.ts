"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"
import type { ClearanceStatus } from "../types" 
import { PaymentMethod } from "../../fees/types"
import { approvePaymentClearanceUpdate, logManualPaymentClearanceUpdate, rejectPaymentClearanceUpdate } from "@/firebase"
import { recalculateClearanceStatus } from "@/firebase/clearance"
import { PaymentType } from "@/constants/types"
import { generateReceiptId } from "../../payments/utils"
import { ReceiptData } from "@/components/organization/PaymentReceiptDialog"
import { set } from "zod"

export function useClearanceActions(
  clearances: ClearanceStatus[], 
  setClearances: React.Dispatch<React.SetStateAction<ClearanceStatus[]>>
) {
  const { user: currentUser } = useAuth()
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  
  // Use a ref to store the latest clearances to avoid dependency churn in callbacks
  const clearancesRef = useRef(clearances)
  useEffect(() => {
    clearancesRef.current = clearances
  }, [clearances])

  const updateItemStatus = useCallback(async (
    clearanceId: string,
    referenceIds: string[],
    newStatus: "paid" | "unpaid",
    options?: { 
      addPaymentLog?: { 
        items: { refId: string; title: string; amount: number; paymentType: PaymentType }[]; 
        total: number; 
        date: string; 
        method: PaymentMethod; 
        refNo?: string;
        overallPaymentType?: string | PaymentType; 
      },
      rejectionReason?: string, 
    },
    receiptCode?: string,
  ) => {
    if (!currentUser) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      // 1. Gather Data using the ref to avoid dependency on clearances array
      const currentClearances = clearancesRef.current
      const clearance = currentClearances.find(c => c.id === clearanceId)
      if (!clearance) throw new Error("Clearance not found")

      const studentData = {
        firstName: clearance.userName.split(' ')[0],
        lastName: clearance.userName.split(' ').slice(1).join(' '),
        studentId: clearance.studentId,
        orgId: clearance.orgId
      }

      // Map referenceIds into an array of items with their types
      const itemsToUpdate = referenceIds.map(refId => {
        const item = clearance.blockingItems[refId]
        return item ? { refId, type: item.type } : null
      }).filter(Boolean) as { refId: string, type: PaymentType | string }[]

      // 2. Perform Single Batched Backend Update
      if (newStatus === "paid" && !options?.addPaymentLog) {
        const result = await approvePaymentClearanceUpdate(
          clearanceId, 
          itemsToUpdate, 
          currentUser.uid, 
          `${currentUser.firstName} ${currentUser.lastName}`, 
          studentData,
          receiptCode
        )
        setReceiptData(result?.receipt!);
        setReceiptOpen(true);
      } else if (newStatus === "unpaid" && options?.rejectionReason) {
        await rejectPaymentClearanceUpdate(
          clearanceId, 
          itemsToUpdate, 
          currentUser.uid, 
          `${currentUser.firstName} ${currentUser.lastName}`, 
          options.rejectionReason, 
          studentData
        )
      } else if (options?.addPaymentLog) {
        // Manual Log handles its own updates
        const studentId = clearance.userId || ""
        await logManualPaymentClearanceUpdate(
          clearanceId,
          studentId, 
          options.addPaymentLog.items,
          options.addPaymentLog.method,
          currentUser.uid,
          `${currentUser.firstName} ${currentUser.lastName}`,
          options.addPaymentLog.overallPaymentType,  
          receiptCode 
        )
      }

      // Only recalculate manually if not logged manually (backend does recalculation for manual logs usually)
      if (!options?.addPaymentLog) {
        await recalculateClearanceStatus(clearanceId)
      }

      // 3. Perform optimistic local update
      setClearances(prev => prev.map(cl => {
        if (cl.id !== clearanceId) return cl
        const updatedBlocking = { ...cl.blockingItems }
        
        referenceIds.forEach(refId => {
          const item = updatedBlocking[refId]
          if (!item) return
          
          // Create a NEW item object to ensure reference change triggers re-render
          const newItem = { ...item }
          newItem.status = newStatus === "paid" ? "paid" : "unpaid"
          newItem.pendingReview = false
          
          if (newStatus === "unpaid" && options?.rejectionReason) {
            newItem.paymentHistory = newItem.paymentHistory.map(p => 
              p.status === "pending" 
                ? {
                    ...p,
                    status: "rejected",
                    rejectionReason: options.rejectionReason,
                    verifiedAt: Timestamp.now(),
                    verifiedByName: `${currentUser.firstName} ${currentUser.lastName}`,
                  } 
                : p
            )
          }
          
          if (newStatus === "paid" && !options?.addPaymentLog) {
             newItem.paymentHistory = newItem.paymentHistory.map(p => 
               p.status === "pending" 
                 ? {
                     ...p,
                     status: "verified",
                     verifiedAt: Timestamp.now(),
                     verifiedByName: `${currentUser.firstName} ${currentUser.lastName}`,
                   } 
                 : p
             )
          }
          
          updatedBlocking[refId] = newItem
        })
        
        const overallStatus = Object.values(updatedBlocking).some(
          i => (i.status === "unpaid" || i.balance > 0) && i.isRequiredForClearance
        ) ? "not_cleared" : "cleared"
        
        return { ...cl, blockingItems: updatedBlocking, status: overallStatus }
      }))
    } catch (error) {
      console.error("Action failed:", error)
      toast.error("Something went wrong while updating clearance")
    }
  }, [setClearances, currentUser]) // clearances removed from dependencies

  const approvePayment = useCallback(async (clearanceId: string, referenceIds: string[]) => {
    await updateItemStatus(clearanceId, referenceIds, "paid")
    toast.success("Payment approved – requirement cleared")
  }, [updateItemStatus])

  const rejectPayment = useCallback(async (clearanceId: string, referenceIds: string[], reason?: string) => {
    await updateItemStatus(clearanceId, referenceIds, "unpaid", { 
      rejectionReason: reason || "Payment rejected by admin" 
    })
    toast.success(`Payment rejected${reason ? `: ${reason}` : ""}`)
  }, [updateItemStatus])

  const logManualPayment = useCallback(async (
    clearanceId: string,
    referenceIds: string[],
    totalAmount: number,
    paymentDate: string,
    receiptCode?: string,
  ) => {
    const clearance = clearancesRef.current.find(c => c.id === clearanceId)
    if (!clearance) return

    const items = referenceIds.map(id => ({
      refId: id,
      title: clearance.blockingItems[id]?.title,
      amount: clearance.blockingItems[id]?.balance || 0,
      paymentType: clearance.blockingItems[id]?.type === PaymentType.FEES ? PaymentType.FEES : PaymentType.FINES,
      parentFineId: clearance.blockingItems[id]?.parentFineId || ""
    }))

    const hasFees = items.some(item => item.paymentType === PaymentType.FEES)
    const hasFines = items.some(item => item.paymentType === PaymentType.FINES)

    let overallPaymentType: string | PaymentType = ""
    
    if (hasFees && hasFines) {
      overallPaymentType = PaymentType.BULK
    } else if (hasFees) {
      overallPaymentType = PaymentType.FEES 
    } else if (hasFines) {
      overallPaymentType = PaymentType.FINES 
    }

    await updateItemStatus(clearanceId, referenceIds, "paid", {
      addPaymentLog: {
        items,
        total: totalAmount,
        date: paymentDate,
        method: "cash",
        overallPaymentType,
      },
    }, receiptCode,
      
    )
  }, [updateItemStatus]) // clearances removed from dependencies

  return { approvePayment, rejectPayment, logManualPayment, receiptOpen, setReceiptOpen, receiptData, setReceiptData }
}