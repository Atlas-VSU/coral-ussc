import { FineType } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { getCurrentUser, getCurrentUserData } from "@/firebase/users";
import { FineTypeFormData } from "@/lib/validators";
import { collection, addDoc, Timestamp, updateDoc, doc } from "firebase/firestore";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getAllFineTypes } from "../read/fineType";


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
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

        const fineTypeDoc = await addDoc(collection(db, "fineTypes"), {
            name: fineTypeData.name,
            description: fineTypeData.description,
            defaultAmount: fineTypeData.defaultAmount,
            requiresTimeIn: fineTypeData.requiresTimeIn,
            requiresTimeOut: fineTypeData.requiresTimeOut || false,
            majorEventsOnly: fineTypeData.majorEventsOnly,
            isActive : true,
            orgId : orgId? orgId : currentUser.uid,
            metadata: {
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }
        });
        console.log("Fine type created with ID: ", fineTypeDoc.id);
        const currentOrgId = orgId ? orgId : currentUser.uid;

        // cacheService.invalidate(CACHE_KEYS.clearanceAll(currentOrgId));
    } catch (error) {
        handleFirestoreError(error, `creating fine type`);
        return null;
    }
  }

  export const updateFineType = async (fineTypeId: string, fineTypeData : FineType) => {
    try {
      //for now orgId = userId
      const currentUser = await getCurrentUserData();
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
  
          await updateDoc(doc(collection(db, "fineTypes"), fineTypeId), {
              name: fineTypeData.name,
              description: fineTypeData.description,
              defaultAmount: fineTypeData.defaultAmount,
              requiresTimeIn: fineTypeData.requiresTimeIn,
              requiresTimeOut: fineTypeData.requiresTimeOut || false,
              majorEventsOnly: fineTypeData.majorEventsOnly,
              isActive : true,
              orgId : currentUser.uid,
              metadata: {
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
              }
          });
          const currentOrgId = currentUser.uid;
          // cacheService.invalidate(CACHE_KEYS.clearanceAll(currentOrgId));
      } catch (error) {
          handleFirestoreError(error, `updating fine type`);
          return null;
      }
    }

    export const deleteFineType = async (fineTypeId: string) => {
      try {
        //for now orgId = userId
        const currentUser = await getCurrentUserData();
        if (!currentUser) {
          throw new Error("User not authenticated");
        }
    
            await updateDoc(doc(collection(db, "fineTypes"), fineTypeId), {
                isActive : false,
                metadata: {
                    updatedAt: Timestamp.now(),
                }
            });
            const currentOrgId = currentUser.uid;
            // cacheService.invalidate(CACHE_KEYS.clearanceAll(currentOrgId));
        } catch (error) {
            handleFirestoreError(error, `deleting fine type`);
            return null;
        }
      }