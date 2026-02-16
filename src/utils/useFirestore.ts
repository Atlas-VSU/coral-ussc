import { collection, addDoc, getDocs, DocumentData } from "firebase/firestore";
import { db } from "../firebase/firebase.config";

// Sample collection reference
const sampleCollectionRef = collection(db, "samples");

// Add a new sample
export const addSample = async (text: string) => {
  try {
    const docRef = await addDoc(sampleCollectionRef, {
      text,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

// Get all samples
export const getSamples = async (): Promise<DocumentData[]> => {
  try {
    const snapshot = await getDocs(sampleCollectionRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};
