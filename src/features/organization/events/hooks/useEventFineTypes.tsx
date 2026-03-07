import { useState, useEffect, useCallback, useRef } from "react";
import { FineType } from "../../fines/types";
import { getAllFineTypes } from "@/firebase/fines/read/fineType";

export function useEventFineTypes() {
    const [fineTypes, setFineTypes] = useState<FineType[]>([]);

    const fetchFineTypes = useCallback(async () => {
        try {
            const fineTypesData = await getAllFineTypes();
            setFineTypes(fineTypesData);
        } catch (error) {
            console.error("Error fetching fine types:", error);
        }
     }, []);
  return {
    fineTypes,
    fetchFineTypes,
  };
}
