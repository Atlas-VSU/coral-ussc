import { ProofOfPayment } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, QueryConstraint, startAfter, where } from "firebase/firestore";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";


export const getProofOfPaymentById = async (proofOfPaymentId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.proofOfPayment(proofOfPaymentId),
        async () => {
            const docRef = doc(db, "proofOfPayments", proofOfPaymentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && !docSnap.data().isArchived) {
                return { id: docSnap.id, ...docSnap.data() } as ProofOfPayment;
            }
            return null;
        },
        CACHE_DURATIONS.PAYMENT_HISTORY
    );
}

export const getAllProofOfPayments = async (orgId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.proofOfPayments(orgId),
        async () => {
            const proofOfPaymentsRef = collection(db, "proofOfPayments");
            const q = query(proofOfPaymentsRef, where("orgId", "==", orgId), where("isArchived", "==", false));
            const querySnapshot = await getDocs(q);
            const proofOfPayments: ProofOfPayment[] = [];
            querySnapshot.forEach((doc) => {
                proofOfPayments.push({ id: doc.id, ...doc.data() } as ProofOfPayment);
            });
            return proofOfPayments;
        },
        CACHE_DURATIONS.PAYMENTS
    );
}

export const getProofOfPaymentsPaginated = async (
  orgId: string,
  pageSize: number = 10,
  lastVisibleDoc: any = null,
  searchTerm: string = "",
  statusFilter: string = "all",
  needCount: boolean = false
) => {
    const proofOfPaymentsRef = collection(db, "proofOfPayments");
    let constraints: QueryConstraint[] = [
      where("orgId", "==", orgId),
      where("isArchived", "==", false),
  ];

  if (statusFilter !== "all") {
    constraints.push(where("status", "==", statusFilter));
  }

  // Normalize search term
  const isIdSearch = /\d/.test(searchTerm);
  const normalizedSearch = isIdSearch 
    ? searchTerm.trim() 
    : searchTerm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  if (normalizedSearch) {
    const searchField = isIdSearch ? "studentId" : "userName";
    constraints.push(where(searchField, ">=", normalizedSearch));
    constraints.push(where(searchField, "<=", normalizedSearch + "\uf8ff"));
    constraints.push(orderBy(searchField));
  } else {
    constraints.push(orderBy("updatedAt", "desc"));
  }

  let count = 0;
  if (needCount) {
    const countSnapshot = await getCountFromServer(query(proofOfPaymentsRef, ...constraints));
    count =  countSnapshot.data().count; //This is for total count of searched item
}

  // Apply pagination
  constraints.push(limit(pageSize));
  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }

  const q = query(proofOfPaymentsRef, ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.map((doc) => {
    const data = { id: doc.id, ...doc.data() } as ProofOfPayment;
    const key = CACHE_KEYS.proofOfPayment(doc.id);
    
    // Check if it already exists to determine if it's a "hit" or "miss" for visibility
    const cached = cacheService.get(key);
    if (cached) {
      // Color-coded logs matching cacheService.ts for a professional feel
      console.log(
        `%c[Cache Hit]%c ${key}`,
        "color: #10b981; font-weight: bold;",
        "color: inherit;"
      );
    } else {
      console.log(
        `%c[Cache Miss]%c ${key}`,
        "color: #f59e0b; font-weight: bold;",
        "color: inherit;"
      );
      cacheService.set(key, data, CACHE_DURATIONS.PAYMENTS);
    }
    return data;
  });

  return {
    docs,
    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
    count: count, // Return total count of searched items for pagination controls
  };
};

export const getProofOfPaymentByUserId = async (userId: string, orgId?:string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.proofOfPaymentByUser(userId, orgId || 'unknown'),
        async () => {
            try {
                const constraints = [where("isArchived", "==", false), where("userId", "==", userId)];
                if (orgId) {
                    constraints.push(where("orgId", "==", orgId));
                }
                const docSnap = await getDocs(query(collection(db, "proofOfPayments"),
                    ...constraints));
                
                if (docSnap.empty) {
                    return null;
                }
                const doc = docSnap.docs[0];
                return { id: doc.id, ...doc.data() } as ProofOfPayment;
            } catch (error) {
                console.error("Error fetching proof of payment:", error);
                throw new Error("Failed to fetch proof of payment. Please try again.");
            }
        },
        CACHE_DURATIONS.PAYMENTS
    );
}



export const getPendingProofOfPaymentsByUserId = async (userId: string, orgId?:string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.proofOfPaymentByUser(userId, orgId || 'unknown'),
        async () => {
            try {
                const constraints = [where("isArchived", "==", false), where("userId", "==", userId), where("status", "==", "pending")];
                if (orgId) {
                    constraints.push(where("orgId", "==", orgId));
                }
                const docSnap = await getDocs(query(collection(db, "proofOfPayments"),
                    ...constraints));
                
                if (docSnap.empty) {
                    return null;
                }
                const docs = docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProofOfPayment));
                return docs;
            } catch (error) {
                console.error("Error fetching proof of payment:", error);
                throw new Error("Failed to fetch proof of payment. Please try again.");
            }
        },
        CACHE_DURATIONS.PAYMENTS
    );
}

export const getProofOfPaymentsCount = async (orgId: string, statusFilter: string = "all") => {
  return cacheService.getOrFetch(
    CACHE_KEYS.paymentsCount(orgId, statusFilter),
    async () => {
      const proofOfPaymentsRef = collection(db, "proofOfPayments");
      const constraints: QueryConstraint[] = [
        where("orgId", "==", orgId),
        where("isArchived", "==", false),
      ];
      if (statusFilter !== "all") {
        constraints.push(where("status", "==", statusFilter));
      }
      const countSnapshot = await getCountFromServer(query(proofOfPaymentsRef, ...constraints));
      return countSnapshot.data().count;
    },
    CACHE_DURATIONS.COUNTS
  );
}
