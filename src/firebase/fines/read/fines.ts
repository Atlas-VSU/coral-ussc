import { StudentFines } from "@/features/organization/fines/types";
import { MemberData } from "@/features/organization/members/types";
import { db } from "@/firebase/firebase.config";
import { collection, query, where, getDocs, CollectionReference, DocumentData } from "firebase/firestore";

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