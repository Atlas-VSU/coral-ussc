import { FineType } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { getCurrentUserData } from "@/firebase/users";
import { query, collection, where, getDocs, doc, getDoc, writeBatch, orderBy, limit } from "firebase/firestore";


  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
  };


export const getFineTypeById = async (fineTypeId : string) => {
    try {
      const docRef = doc(db, "fineTypes", fineTypeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
          const doc = docSnap.data();
            return {
                id: fineTypeId,
                orgId: doc.orgId || null,
                name: doc.name,
                description: doc.description,
                defaultAmount: doc.defaultAmount,
                requiresTimeIn: doc.requiresTimeIn,
                requiresTimeOut: doc.requiresTimeOut,
                majorEventsOnly: doc.majorEventsOnly,
                isActive: doc.isActive,
            };
        } else {
          console.log("No such document!");
              return null;
        }
       
      } catch (error) {
        handleFirestoreError(error, "fetch fine type");
        return null;
      }
}
  

export const getAllFineTypes = async () => { 

  try {
    const currentUser = await getCurrentUserData();
    let fineTypeQuery = query(
      collection(db, "fineTypes"),
      where("isActive", "==", true),
      where("orgId", "==",currentUser?.uid || null)
    );
    const querySnapshot = await getDocs(fineTypeQuery);
    const fineTypes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      orgId: doc.data().orgId || null,
      name: doc.data().name,
      description: doc.data().description,
      defaultAmount: doc.data().defaultAmount,
      requiresTimeIn: doc.data().requiresTimeIn,
      requiresTimeOut: doc.data().requiresTimeOut,
      majorEventsOnly: doc.data().majorEventsOnly,
      isActive: doc.data().isActive,
    })) as FineType[];
    return fineTypes;
  } catch (error) {
    handleFirestoreError(error, "fetch fine types");
    return [];
  }
}

