import { db } from "@/firebase/firebase.config";
import { getCurrentUser, getCurrentUserData } from "@/firebase/users";
import { FineTypeFormData } from "@/lib/validators";
import { collection, addDoc, Timestamp } from "firebase/firestore";


  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
  };

export const createFineType = async (fineTypeData : FineTypeFormData, orgId? : string) => {
  try {
    //for now orgId = userId
      const currentUser = await getCurrentUserData();

        const fineTypeDoc = await addDoc(collection(db, "fineTypes"), {
            name: fineTypeData.name,
            description: fineTypeData.description,
            defaultAmount: fineTypeData.defaultAmount,
            requiresTimeIn: fineTypeData.requiresTimeIn,
            requiresTimeOut: fineTypeData.requiresTimeOut || false,
            majorEventsOnly: fineTypeData.majorEventsOnly,
            isActive : true,
            orgId : orgId? orgId : currentUser?.uid || null,
            metadata: {
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }
        });
        console.log("Fine type created with ID: ", fineTypeDoc.id);
    } catch (error) {
        handleFirestoreError(error, `creating fine type`);
        return null;
    }
  }