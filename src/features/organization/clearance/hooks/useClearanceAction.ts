import { useCallback } from "react"
import { toast } from "sonner"
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"
import type { ClearanceStatus } from "../types" 
import { PaymentLog, PaymentMethod } from "../../fees/types"
import { approvePaymentClearanceUpdate, logManualPaymentClearanceUpdate, rejectPaymentClearanceUpdate } from "@/firebase"
import { recalculateClearanceStatus } from "@/firebase/clearance"
import { PaymentType } from "@/constants/types"
import { db } from "@/firebase/firebase.config"
import { boolean } from "zod"

export function useClearanceActions(
  clearances: ClearanceStatus[], 
  setClearances: React.Dispatch<React.SetStateAction<ClearanceStatus[]>>
) {
  const { user: currentUser } = useAuth()

  const updateItemStatus = useCallback(async (
    clearanceId: string,
    referenceIds: string[],
    newStatus: "paid" | "unpaid",
    options?: { 
      addPaymentLog?: { items: { refId: string; amount: number; paymentType: PaymentType }[]; total: number; date: string; method: PaymentMethod; refNo?: string },
      rejectionReason?: string 
    }
  ) => {
    if (!currentUser) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      // 1. Perform Backend Updates
      for (const refId of referenceIds) {
        const clearance = clearances.find(c => c.id === clearanceId)
        const item = clearance?.blockingItems[refId]
        if (!item) continue

        const studentData = clearance ? {
          firstName: clearance.userName.split(' ')[0],
          lastName: clearance.userName.split(' ').slice(1).join(' '),
          studentId: clearance.studentId,
          orgId: clearance.orgId
        } : undefined

        if (newStatus === "paid" && !options?.addPaymentLog) {
          await approvePaymentClearanceUpdate(clearanceId, refId, currentUser.uid, `${currentUser.firstName} ${currentUser.lastName}`, item.type, studentData)
        } else if (newStatus === "unpaid" && options?.rejectionReason) {
          await rejectPaymentClearanceUpdate(clearanceId, refId, currentUser.uid, `${currentUser.firstName} ${currentUser.lastName}`, options.rejectionReason, item.type, studentData)
        }
      }

      if (options?.addPaymentLog) {
        const studentId = clearances.find(c => c.id === clearanceId)?.userId || ""
        await logManualPaymentClearanceUpdate(
          clearanceId,
          studentId, // Pass studentId to backendLogManualPayment
          options.addPaymentLog.items,
          options.addPaymentLog.method,
          currentUser.uid,
          `${currentUser.firstName} ${currentUser.lastName}`
        )
      }

      await recalculateClearanceStatus(clearanceId)

      // 2. Perform optimistic local update (optional since useClearances uses onSnapshot)
      setClearances(prev => prev.map(cl => {
        if (cl.id !== clearanceId) return cl
        const updatedBlocking = { ...cl.blockingItems }
        
        referenceIds.forEach(refId => {
          const item = updatedBlocking[refId]
          if (!item) return
          
          item.status = newStatus
          item.pendingReview = false
          
          if (newStatus === "unpaid" && options?.rejectionReason) {
            const pendingLogIndex = item.paymentHistory.findIndex(p => p.status === "pending_verification")
            if (pendingLogIndex !== -1) {
              item.paymentHistory[pendingLogIndex] = {
                ...item.paymentHistory[pendingLogIndex],
                status: "rejected",
                rejectionReason: options.rejectionReason,
                verifiedAt: Timestamp.now(),
                verifiedByName: `${currentUser.firstName} ${currentUser.lastName}`,
              }
            }
          }
          
          if (newStatus === "paid" && !options?.addPaymentLog) {
             const pendingLogIndex = item.paymentHistory.findIndex(p => p.status === "pending_verification")
             if (pendingLogIndex !== -1) {
               item.paymentHistory[pendingLogIndex] = {
                 ...item.paymentHistory[pendingLogIndex],
                 status: "verified",
                 verifiedAt: Timestamp.now(),
                 verifiedByName: `${currentUser.firstName} ${currentUser.lastName}`,
               }
             }
          }

          if (options?.addPaymentLog) {
             // Local update for manual payment logs
             // (In reality, onSnapshot will override this very soon)
          }
        })
        
        const overallStatus = Object.values(updatedBlocking).some(
          i => i.status === "unpaid" && i.isRequiredForClearance
        ) ? "not_cleared" : "cleared"
        
        return { ...cl, blockingItems: updatedBlocking, status: overallStatus }
      }))
    } catch (error) {
      console.error("Action failed:", error)
      toast.error("Something went wrong while updating clearance")
    }
  }, [setClearances, currentUser, clearances])

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
    paymentDate: string
  ) => {
    // We need to map referenceIds to items {refId, amount}
    const clearance = clearances.find(c => c.id === clearanceId)
    const items = referenceIds.map(id => ({
      refId: id,
      amount: clearance?.blockingItems[id]?.balance || 0,
      paymentType: clearance?.blockingItems[id]?.type === "fee" ? PaymentType.FEES : PaymentType.FINES
    }))


    await updateItemStatus(clearanceId, referenceIds, "paid", {
      addPaymentLog: {
        items,
        total: totalAmount,
        date: paymentDate,
        method: "cash",
      }
    })
  }, [updateItemStatus, clearances])

  return { approvePayment, rejectPayment, logManualPayment }
}