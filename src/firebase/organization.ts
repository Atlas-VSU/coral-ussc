import { Organization, Term } from "@/constants/types";
import { db } from "@/firebase/firebase.config";
import { collection, addDoc, Timestamp, updateDoc, doc, getDocs, CollectionReference, DocumentData, query, where, getDoc } from "firebase/firestore";


const orgCollection: CollectionReference<DocumentData> = collection(
    db,
    "organizations"
  );

  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
  };

export const createOrg = async (org: Organization) => {
    try {
        const duplicate = await checkForDuplicateOrgs(org.name);
        if (duplicate) {
            throw new Error(`Organization named ${org.name} already exists. Cannot create a duplicate.`);
        }
        await addDoc(orgCollection, {
            name: org.name,
            shortName: org.shortName,
            users: org.users || null,
            facultyId: org.facultyId || null,
            programId: org.programId || null,
            isArchived: false,
            subscribed: org.subscribed,
            metadata: {
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }
        });

    } catch (error) {
        handleFirestoreError(error, `creating organization`);
        return null;
    }
}
  

export const getOrgByName = async (name: string) => {
    try {
        const q = query(orgCollection, where("name", "==", name ), where("isArchived", "==", false));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const orgDoc = snapshot.docs[0];
            return {
                id: orgDoc.id,
                name: orgDoc.data().name,
                shortName: orgDoc.data().shortName,
                isArchived: orgDoc.data().isArchived,
                subscribed: orgDoc.data().subscribed,
                users: orgDoc.data().users,
                programId: orgDoc.data().programId,
                facultyId: orgDoc.data().facultyId
            } as Organization;
        }
            return null
    } catch (error) {
        handleFirestoreError(error, `fetching organization`);
        return null;
    }
}

export const getOrgById = async (id: string) => {
    try {
        const orgDoc = await getDoc(doc(orgCollection, id));
        if (orgDoc.exists()) {
            return {
                id: orgDoc.id,
                name: orgDoc.data().name,
                shortName: orgDoc.data().shortName,
                isArchived: orgDoc.data().isArchived,
                subscribed: orgDoc.data().subscribed,
                users: orgDoc.data().users,
                programId: orgDoc.data().programId,
                facultyId: orgDoc.data().facultyId
            } as Organization;
        }
            return null
    } catch (error) {
        handleFirestoreError(error, `fetching organization`);
        return null;
    }
}

export const checkForDuplicateOrgs = async (name: string) => {
    try {
        const q = query(orgCollection, where("name", "==", name));
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
