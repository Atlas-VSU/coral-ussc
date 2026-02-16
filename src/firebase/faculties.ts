/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.config";

const handleFirestoreError = (error: any, context: string) => {
  console.error(`Error ${context}:`, error);
  throw new Error(`Failed to ${context}`);
};

export const getFaculties = async () => {
  try {
    const facultiesCollection = collection(db, "faculties");
    const querySnapshot = await getDocs(facultiesCollection);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    handleFirestoreError(error, "fetch faculties");
  }
};
