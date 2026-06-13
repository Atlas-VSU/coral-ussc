import { Term } from "@/constants/types";
import { db } from "@/firebase/firebase.config";
import { collection, addDoc, Timestamp, updateDoc, doc, getDocs, CollectionReference, DocumentData, query, where } from "firebase/firestore";


const termsCollection: CollectionReference<DocumentData> = collection(
    db,
    "terms"
  );

  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
  };

export const createTerm = async (AY: string, sem: string) => {
    try {
      
        const term = await getActiveTerm();
        const duplicate = await checkForDuplicateTerms(AY, sem);
        if (duplicate) {
            throw new Error(`Active term for AY ${AY} (${sem}) already exists. Cannot create a duplicate.`);
        }
        await addDoc(termsCollection, {
            AY: AY,
            semester: sem,
            isActive : true,
            metadata: {
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            isDeleted: false,
        });
        if (term) {
            await updateDoc(doc(termsCollection, term!.id), {
            isActive: false,
            "metadata.updatedAt": Timestamp.now(),
        });
        }

    } catch (error) {
        handleFirestoreError(error, `creating term`);
        return null;
    }
}
  
export const getActiveTerm = async () => {
    try {
        const q = query(termsCollection,
            where("isActive", "==", true),
            where("isDeleted", "==", false));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const termDoc = snapshot.docs[0];
            return { id: termDoc.id, AY:termDoc.data().AY, semester: termDoc.data().semester, isActive: termDoc.data().isActive } as Term;
        }
            return null
    } catch (error) {
        handleFirestoreError(error, `fetching current Term`);
        return null;
    }
}

export const getAllTerms = async () => {
    try {
        const snapshot = await getDocs(termsCollection);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            AY: doc.data().AY,
            semester: doc.data().semester,
            isActive: doc.data().isActive,
            metadata: doc.data().metadata,
            isDeleted: doc.data().isDeleted,
        })) as Term[];
    } catch (error) {
        handleFirestoreError(error, `fetching all Terms`);
        return [];
    }
}

export const checkForDuplicateTerms = async (AY: string, sem: string) => {
    try {
        const q = query(termsCollection,
            where("AY", "==", AY),
            where("semester", "==", sem));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return false;
        }
        return true;
    } catch (error) {
        handleFirestoreError(error, `checking duplicates`);
        return null;
    }
}

