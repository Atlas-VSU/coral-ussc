"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { fetchClearanceDocuments } from "@/firebase"
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

    let isMounted = true;
    
    // Initial fetch from cache/API
    const loadInitialData = async () => {
      try {
        const data = await fetchClearanceDocuments(orgId);
        if (isMounted) {
          setClearances(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Initial clearance fetch failed:", err);
        // Fallback: loading will remain true until snapshot arrives or error handled
      }
    };

    loadInitialData();

    const clearanceRef = collection(db, "clearanceStatus")
    const q = query(
      clearanceRef,
      where("orgId", "==", orgId),
      where("isArchived", "==", false),
      orderBy("updatedAt", "desc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ClearanceStatus[]
        
        if (isMounted) {
          setClearances(docs)
          setLoading(false)
          setError(null)
        }
      },
      (err) => {
        console.error("Error fetching clearances:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch clearances"))
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false;
      unsubscribe();
    }
  }, [orgId])

  return { clearances, loading, error, setClearances }
}
