"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Fee } from "../types"
import { getCurrentUserData } from "@/firebase";
import { fetchFeesForOrg } from "@/firebase/fees";
import { toast } from "sonner";

export function useFeeList() {
    const [rawFees, setRawFees] = useState<Fee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFees = async() => {
            setIsLoading(true)
            try {
                const user = await getCurrentUserData();
                if(!user) 
                    throw new Error("Noth Authenticated!");
                
                const data = await fetchFeesForOrg(user.uid);
                
                setRawFees(data);
            }
            catch (error) {
                toast.error("Could not load fees at this time.");
                console.error(error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadFees();
    }, [])

    const groupedFees = useMemo(() => {
        return rawFees.reduce((accumulator, currentFee) => {
            const groupKey = currentFee.title;

            if(!accumulator[groupKey]) {
                accumulator[groupKey] = [];
            }

            accumulator[groupKey].push(currentFee);
            
            return accumulator;
        }, {} as Record<string, Fee[]>);
    }, [rawFees])

    const refetchFees = useCallback(() => {
        const loadFees = async() => {
            setIsLoading(true)
            try {
                const user = await getCurrentUserData();
                if(!user) 
                    throw new Error("Noth Authenticated!");
                
                const data = await fetchFeesForOrg(user.uid);
                setRawFees(data);
            }
            catch (error) {
                toast.error("Could not load fees at this time.");
                console.error(error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadFees();
    }, [])


 
    return {
        rawFees,
        groupedFees,
        isLoading,
        refetchFees
    }
}