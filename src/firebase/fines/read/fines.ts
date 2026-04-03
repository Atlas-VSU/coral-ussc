
import { FineItem, StudentFines } from "@/features/organization/fines/types";
import { Member, MemberData } from "@/features/organization/members/types";
import { StudentFineItem } from "@/features/organization/payments/types";
import { db } from "@/firebase/firebase.config";
import { getCurrentUserData } from "@/firebase/users";
import { collection, query, where, getDocs, CollectionReference, DocumentData, DocumentSnapshot, orderBy, limit, startAfter, getCountFromServer, getDoc, doc, onSnapshot, connectFirestoreEmulator } from "firebase/firestore";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";

const finesCollection: CollectionReference<DocumentData> = collection(
    db,
    "fines"
  );

  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
  };

export const getFinesByStudents = async (students: MemberData[]) => {
  const studentIds = students.map(s => s.member.studentId).sort();
  if (studentIds.length === 0) return [];

  // Simple hash for the student IDs to use as a cache key
  const hash = studentIds.join(',').length + studentIds.reduce((acc, id) => acc + id.split('').reduce((a, c) => a + c.charCodeAt(0), 0), 0);
  const cacheKey = CACHE_KEYS.finesBatch(hash.toString());

  return cacheService.getOrFetch(
    cacheKey,
    async () => {
      try {
        // ── Chunk into groups of 30 (Firebase "in" limit) ──────────────────────
        const CHUNK_SIZE    = 30;
        const PARALLEL_LIMIT = 20; // max concurrent Firestore requests at a time

        const chunks: string[][] = [];
        for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
          chunks.push(studentIds.slice(i, i + CHUNK_SIZE));
        }

        const fineDocs: StudentFines[] = [];
        for (let i = 0; i < chunks.length; i += PARALLEL_LIMIT) {
          const group = chunks.slice(i, i + PARALLEL_LIMIT);
          const snapshots = await Promise.all(
            group.map(chunk =>
              getDocs(query(
                finesCollection,
                where("studentId", "in", chunk),
                where("metadata.isArchived", "==", false),
              ))
            )
          );

          snapshots
            .flatMap(snapshot => snapshot.docs)
            .forEach(doc => {
              fineDocs.push({ id: doc.id, ...doc.data() } as StudentFines);
            });
        }
        return fineDocs;
      } catch (error) {
        handleFirestoreError(error, `fetching fine documents for student IDs`);
        return [];
      }
    },
    CACHE_DURATIONS.FINES
  );
};

export const getFineByStudentId = async (studentId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.fineByStudent(studentId),
        async () => {
            const fineQuery = query(
                finesCollection,
                where("studentId", "==", studentId),
                where("metadata.isArchived", "==", false),
                limit(1)
            );
            const querySnapshot = await getDocs(fineQuery);
            if (!querySnapshot.empty) {
                const fineDoc = querySnapshot.docs[0];
                return { id: fineDoc.id, ...fineDoc.data() } as StudentFines;
            }
            return null;
        },
        CACHE_DURATIONS.FINES
    );
}

export const getFineById = async (fineId: string) => {
  return cacheService.getOrFetch(
    CACHE_KEYS.fineDoc(fineId),
    async () => {
      const fineDoc = await getDoc(doc(db, "fines", fineId));
      if (!fineDoc.exists()) {
        console.warn(`No fine document found for fine ID: ${fineId}`);
        return null;
      }
      return { id: fineDoc.id, ...fineDoc.data() } as StudentFines;
    },
    CACHE_DURATIONS.FINES
  );
}

export const countFinesOfStudents = async (status: string) => { 
  const currUser = await getCurrentUserData() as unknown as Member;
  return cacheService.getOrFetch(
    `fines:count:${currUser.id}:${status}`,
    async () => {
      const coll = collection(db, "fines");
      let q = null;
      if (status === "all") {
        q = query(coll, where("metadata.isArchived", "==", false), where("orgId", "==", currUser.id));
      } else {
        q =  query(coll, where("metadata.isArchived", "==", false),where("orgId", "==", currUser.id), where("status", "==", status));
      }

      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    CACHE_DURATIONS.FINES
  );
}


export const countUnsettleFinesOfStudents = async () => { 
  const currUser = await getCurrentUserData() as unknown as Member;
  return cacheService.getOrFetch(
    `fines:countUnsettled:${currUser.id}`,
    async () => {
      const coll = collection(db, "fines");
      let q = query(coll, where("metadata.isArchived", "==", false), where("orgId", "==", currUser.id), where("status", "==", "unpaid"), where("accumulatedAmount", ">", 0));
      let snapshot = await getCountFromServer(q);
      let total = snapshot.data().count;

      q = query(coll, where("metadata.isArchived", "==", false), where("orgId", "==", currUser.id), where("status", "==", "partial"));
      snapshot = await getCountFromServer(q);
      total += snapshot.data().count;

      q = query(coll, where("metadata.isArchived", "==", false), where("orgId", "==", currUser.id), where("status", "==", "pending"));
      snapshot = await getCountFromServer(q);
      total += snapshot.data().count;
      return total;
    },
    CACHE_DURATIONS.COUNTS
  );
}

export const countStudentsWithFines = async () => { 
  const currUser = await getCurrentUserData() as unknown as Member;
  return cacheService.getOrFetch(
    `fines:countWithFines:${currUser.id}`,
    async () => {
      const coll = collection(db, "fines");
      const q = query(coll, where("metadata.isArchived", "==", false), where("orgId", "==", currUser.id), where("accumulatedAmount", ">", 0));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    CACHE_DURATIONS.COUNTS
  );
}

export const getFineItemsByFineId = async (fineId: string) => {
  return cacheService.getOrFetch(
    CACHE_KEYS.fineItems(fineId),
    async () => {
      const fineDoc = await getDocs(query(collection(db, "fines", fineId, "fineItems"), where("isArchived", "==", false)));
      return fineDoc.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FineItem[];
    },
    CACHE_DURATIONS.FINES
  );
}

export const getUnpaidFineItemsByFineId = async (fine: StudentFines) => {
  return cacheService.getOrFetch(
    CACHE_KEYS.fineUnpaidItems(fine.id!),
    async () => {
      const fineDoc = await getDocs(query(collection(db, "fines", fine.id!, "fineItems"), where("isArchived", "==", false), where("isPaid", "==", false)));
      return fineDoc.docs.map(doc => ({ refId: doc.id, userId: fine.userId, fine: fine, parentFineId: fine.id!, title: doc.data().eventName, amount: doc.data().amount })) as StudentFineItem[];
    },
    CACHE_DURATIONS.PAYMENTS
  );
}


/**
 * Fetches fine documents with server-side pagination and searching.
 */
export const fetchFinesPaginated = async (
  orgId: string,
  pageSize: number = 10,
  lastVisibleDoc: any = null,
  searchTerm: string = "",
  statusFilter: string = "all"
) => {
  let constraints: any[] = [
    where("orgId", "==", orgId),
    where("metadata.isArchived", "==", false),
    where("accumulatedAmount", ">", 0),
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
    constraints.push(orderBy("metadata.updatedAt", "desc"));
  }

  // Apply pagination
  constraints.push(limit(pageSize));
  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }

  const q = query(finesCollection, ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.map((doc) => {
    const data = { id: doc.id, ...doc.data() } as StudentFines;
    // Granular caching: Cache each document individually
    cacheService.set(CACHE_KEYS.fineDoc(doc.id), data, CACHE_DURATIONS.FINES);
    return data;
  });

  return {
    docs,
    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
    allSnapshots: snapshot.docs,
  };
};

/**
 * Gets the total count of fine documents for an organization with optional search.
 */
export const getFinesCount = async (orgId: string, statusFilter: string = "all", searchTerm: string = "") => {
  return cacheService.getOrFetch(
    CACHE_KEYS.clearanceCount(orgId, statusFilter, searchTerm).replace('clearance:count', 'fines:count'),
    async () => {
      const constraints: any[] = [
        where("orgId", "==", orgId),
        where("metadata.isArchived", "==", false),
        where("accumulatedAmount", ">", 0),
      ];

      if (statusFilter !== "all") {
        constraints.push(where("status", "==", statusFilter));
      }

      const isIdSearch = /\d/.test(searchTerm);
      const normalizedSearch = isIdSearch 
        ? searchTerm.trim() 
        : searchTerm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

      if (normalizedSearch) {
        const searchField = isIdSearch ? "studentId" : "userName";
        constraints.push(where(searchField, ">=", normalizedSearch));
        constraints.push(where(searchField, "<=", normalizedSearch + "\uf8ff"));
      }

      const q = query(finesCollection, ...constraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    CACHE_DURATIONS.COUNTS
  );
};

export const subscribeFines = (
  userId: string,
  onUpdate: (fines: StudentFines[]) => void,
  onError?: (error: Error) => void
) => {
  // Deprecated for the main roster due to performance with labels like 9,000 students
  console.warn("subscribeFines is deprecated for large datasets. Use fetchFinesPaginated instead.");
  
  const constraints = [
    where("metadata.isArchived", "==", false),
    where("orgId", "==", userId),
    where("accumulatedAmount", ">", 0),
    orderBy("metadata.updatedAt", "desc"),
    limit(100), // Safety limit
  ];

  return onSnapshot(
    query(finesCollection, ...constraints),
    (snapshot) => {
      const fines = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StudentFines[];
      onUpdate(fines);
    },
    (error) => onError?.(error)
  );
};

 
export const getFineItemsByIds = async (fineId:string, fineItemIds: string[]) => {
  const hash = fineItemIds.sort().join(',');
  return cacheService.getOrFetch(
    `fines:items:subset:${fineId}:${hash}`,
    async () => {
      try {
        const colRef = collection(db, "fines", fineId, "fineItems");
        const q = query(colRef, where("id", "in", fineItemIds));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          return [];
        }
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as FineItem[];
      } catch (error) {
        handleFirestoreError(error, "Fetching all fine items for a student");
        return [];
      }
    },
    CACHE_DURATIONS.FINES
  );
}