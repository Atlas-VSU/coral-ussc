/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { Member, Program } from "@/features/organization/members/types";
import { getCurrentUserData } from "./users";

const handleFirestoreError = (error: any, context: string) => {
  console.error(`Error ${context}:`, error);
  throw new Error(`Failed to ${context}`);
};

// Main function to get programs based on user role
export const getPrograms = async () => {
  try {
    const currentUser = (await getCurrentUserData()) as Member | null;
    if (!currentUser) return [];

    if (currentUser.accessLevel == 1) {
      const program = await getProgramById(currentUser.programId)
      return program ? [program] : []
    }
    else if (currentUser.accessLevel == 2) {
      const programsCollection = collection(db, "programs");
      const q = query(
        programsCollection,
        where("facultyId", "==", currentUser.facultyId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    else {
      const programsCollection = collection(db, "programs");
      const querySnapshot = await getDocs(query(programsCollection));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    }
  } catch (error) {
    handleFirestoreError(error, "fetch programs");
  }
};

// Fetches a single program directly by its ID
export const getProgramById = async (
  programId: string
): Promise<Program | null> => {
  try {
    // **FIX:** This function no longer calls getPrograms().
    // It fetches the document directly from Firestore, which is efficient and avoids the infinite loop.
    const docRef = doc(db, "programs", programId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Program;
    } else {
      console.warn(`No program found with ID: ${programId}`);
      return null;
    }
  } catch (error) {
    handleFirestoreError(error, `fetch program by ID: ${programId}`);
    return null; // Ensure null is returned on error
  }
};

// Fetches programs specifically for a faculty or a single student program
export const getProgramByFacultyId = async () => {
  try {
    const currentUser = (await getCurrentUserData()) as Member | null;
    if (!currentUser) return null;

    // Check if user is a student first
    if (currentUser.accessLevel == 1) {
      const program = await getProgramById(currentUser.programId);
      // **FIX:** Now correctly calls the fixed getProgramById function.
      return program ? [program] : null;
    }
    else if (currentUser.accessLevel == 2) {
      const programsCollection = collection(db, "programs");
      const q = query(
        programsCollection,
        where("facultyId", "==", currentUser.facultyId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    else {
      const programsCollection = collection(db, "programs");
      const querySnapshot = await getDocs(query(programsCollection));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    } 
  } catch (error) {
    handleFirestoreError(error, "fetch program by faculty ID");
    return null;
  }
};
