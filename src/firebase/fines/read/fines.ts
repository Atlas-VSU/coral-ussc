
import { FineItem, StudentFines } from "@/features/organization/fines/types";
import { Member, MemberData } from "@/features/organization/members/types";
import { db } from "@/firebase/firebase.config";
import { getCurrentUserData } from "@/firebase/users";
import { collection, query, where, getDocs, CollectionReference, DocumentData, DocumentSnapshot, orderBy, limit, startAfter, getCountFromServer, getDoc, doc } from "firebase/firestore";

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
  try {
    const studentIds = students.map(s => s.member.studentId);

    if (studentIds.length === 0) return [];

    // ── Chunk into groups of 30 (Firebase "in" limit) ──────────────────────
    const CHUNK_SIZE    = 30;
    const PARALLEL_LIMIT = 20; // max concurrent Firestore requests at a time

    const chunks: string[][] = [];
    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
      chunks.push(studentIds.slice(i, i + CHUNK_SIZE));
    }
    // e.g. 9000 students → 300 chunks → 15 groups of 20 parallel queries

    // ── Process chunks in throttled parallel groups ─────────────────────────
    const fineDocs: StudentFines[] = [];

    for (let i = 0; i < chunks.length; i += PARALLEL_LIMIT) {
      const group = chunks.slice(i, i + PARALLEL_LIMIT);

      const snapshots = await Promise.all(
        group.map(chunk =>
          getDocs(query(
            finesCollection,
            where("studentId", "in", chunk),
            where("metadata.isArchived", "==", false)
          ))
        )
      );

      snapshots
        .flatMap(snapshot => snapshot.docs)
        .forEach(doc => {
          fineDocs.push({ id: doc.id, ...doc.data() } as StudentFines);
        });
    }

    if (fineDocs.length === 0) {
      console.warn(`No fine documents found for ${studentIds.length} student IDs.`);
    }

    return fineDocs;

  } catch (error) {
    handleFirestoreError(error, `fetching fine documents for student IDs`);
    return [];
  }
};

  export const getFineByStudentId = async (studentId: string) => {
    try{
        const fineQuery = query(
            finesCollection,
            where("studentId", "==", studentId),
            where("metadata.isArchived", "==", false)
        );
        const querySnapshot = await getDocs(fineQuery);
        if (!querySnapshot.empty) {
            const fineDoc = querySnapshot.docs[0];
            return {
                id: fineDoc.id,
                ...fineDoc.data()
            } as StudentFines; 
        }else
        {
            console.warn(`No fine document found for student ID: ${studentId}`);
            return null;
        }
    }catch (error) {
        handleFirestoreError(error, `fetching fine documents for student ID ${studentId}`);
        return null;
    }
}

export const getFineById = async (fineId: string) => {
  try{
    const fineDoc = await getDoc(doc(db, "fines", fineId));
    if (!fineDoc.exists()) {
      console.warn(`No fine document found for fine ID: ${fineId}`);
      return null;
    }
    return {
      id: fineDoc.id,
      ...fineDoc.data()
    } as StudentFines;
  }catch (error) {
    handleFirestoreError(error, `fetching fine documents for fine ID ${fineId}`);
    return null;
  }
}

export const countFinesOfStudents = async (status: string) => { 
  const currUser = await getCurrentUserData() as unknown as Member;
  const coll = collection(db, "fines");
  try {
    let q = null;
    if (status === "all") {
      q = query(coll, where("metadata.isArchived", "==", false), where("orgId", "==", currUser.id));
    } else {
      q =  query(coll, where("metadata.isArchived", "==", false),where("orgId", "==", currUser.id), where("status", "==", status));
    }

    const snapshot = await getCountFromServer(q);
    const total = snapshot.data().count;
    return total;
  }
  catch (error) {
    handleFirestoreError(error, `counting fines with status ${status}`);
    return 0;
  }

}


export const countUnsettleFinesOfStudents = async () => { 
  const currUser = await getCurrentUserData() as unknown as Member;
  const coll = collection(db, "fines");
  try {

    let q =  query(coll, where("metadata.isArchived", "==", false),where("orgId", "==", currUser.id), where("status", "==", "unpaid"));
    let snapshot = await getCountFromServer(q);
    let total = snapshot.data().count;

    q =  query(coll, where("metadata.isArchived", "==", false),where("orgId", "==", currUser.id), where("status", "==", "partially paid"));
    snapshot = await getCountFromServer(q);
    total += snapshot.data().count;

    q =  query(coll, where("metadata.isArchived", "==", false),where("orgId", "==", currUser.id), where("status", "==", "pending"));
    snapshot = await getCountFromServer(q);
    total += snapshot.data().count;
    return total;
  }
  catch (error) {
    handleFirestoreError(error, `counting fines with status ${status}`);
    return 0;
  }

}

export const countStudentsWithFines = async () => { 
  const currUser = await getCurrentUserData() as unknown as Member;
  const coll = collection(db, "fines");
  try {

    const q =  query(coll, where("metadata.isArchived", "==", false),where("orgId", "==", currUser.id));
    const snapshot = await getCountFromServer(q);
    const total = snapshot.data().count;
    return total;
  }
  catch (error) {
    handleFirestoreError(error, `counting fines with status ${status}`);
    return 0;
  }

}

export const getFineItemsByFineId = async (fineId: string) => {
  try {
    const fineDoc = await getDocs(query(collection(db, "fines", fineId, "fineItems"), where("isArchived", "==", false)));
    return fineDoc.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FineItem[];
  } catch (error) {
    handleFirestoreError(error, `fetching fine items for fine ID ${fineId}`);
    return [];
  }
}


export const getAllFines = async (status?: string) => {
  try {
    const currUser = await getCurrentUserData() as unknown as Member;
    const constraints = [
      where("metadata.isArchived", "==", false),
      where("orgId", "==", currUser.id),
      where("accumulatedAmount", ">", 0),
      orderBy("metadata.updatedAt", "desc"),
      ...(status && status !== "all" ? [where("status", "==", status)] : []),
    ];
    const snapshot = await getDocs(query(finesCollection, ...constraints));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StudentFines[];
  } catch (error) {
    handleFirestoreError(error, "fetching all fines lightweight");
    return [];
  }
};

export const getAllUnpaidFinesforOrg = async () => {
  try {
    const currUser = await getCurrentUserData() as unknown as Member;
    const snapshot = await getDocs(query(finesCollection, where("metadata.isArchived", "==", false), where("orgId", "==", currUser.id), where("status", "in", ["unpaid", "partially_paid"])));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StudentFines[];
  }catch (error) {
    handleFirestoreError(error, "fetching all unpaid fines for org");
    return [];
  }
 }