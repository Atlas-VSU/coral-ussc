"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/firebase/firebase.config"
import type { ClearanceStatus } from "../types"

export function useClearances(orgId: string | undefined) {
  const [clearances, setClearances] = useState<ClearanceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const clearanceRef = collection(db, "clearanceStatus")
    const q = query(
      clearanceRef,
      where("orgId", "==", orgId),
      where("isArchived", "==", false)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ClearanceStatus[]
        setClearances(docs)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error fetching clearances:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch clearances"))
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [orgId])

  return { clearances, loading, error, setClearances }
}
