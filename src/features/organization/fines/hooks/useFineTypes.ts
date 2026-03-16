import { useState } from "react";
import { FineType } from "@/features/organization/fines/types";
import { getAllFineTypes } from "@/firebase/fines/read/fineType";
import { createFineType, updateFineType, deleteFineType } from "@/firebase/fines/create/fineType";
import { toast } from "sonner";

export function useFineTypes() {
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const fetchFineTypes = async () => {
    try {
      const docs = await getAllFineTypes();
      setFineTypes(docs);
    } catch (error) {
      console.error("Failed to fetch fine types:", error);
    }
  };

  const handleAddFineSubmission = async (
    data: FineType, 
    onSuccess?: () => void
  ) => {
    setIsFormSubmitting(true);
    try {
      await createFineType(data);
      fetchFineTypes();
      toast.success(`${data.name} was added successfully`);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to add ${data.name}`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleUpdateFineType = async (
    fineTypeId: string, 
    data: FineType, 
    onSuccess?: () => void
  ) => {
    setIsFormSubmitting(true);
    try {
      await updateFineType(fineTypeId, data);
      fetchFineTypes();
      toast.success(`${data.name} was updated successfully`);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to update ${data.name}`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteFineType = async (
    fineTypeId: string, 
    onSuccess?: () => void
  ) => {
    setIsFormSubmitting(true);
    try {
      await deleteFineType(fineTypeId);
      fetchFineTypes();
      toast.success(`Fine type was deleted successfully`);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to delete fine type`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  return {
    fineTypes,
    isFormSubmitting,
    fetchFineTypes,
    handleAddFineSubmission,
    handleUpdateFineType,
    handleDeleteFineType,
  };
}
