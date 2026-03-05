"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AggregatedFee, Fee } from "../types"
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

    
    const aggregatedFees = useMemo<AggregatedFee[]>(() => {
        if (!rawFees || !Array.isArray(rawFees)) return [];

        const groups = (rawFees as Fee[]).reduce((acc, fee) => {
        const title = fee.title;
        if (!acc[title]) acc[title] = [];
        acc[title].push(fee);
        return acc;
        }, {} as Record<string, Fee[]>);

        return Object.entries(groups).map(([title, feeList]) => {
        const first = feeList[0];
        const paidCount = feeList.filter(f => f.status === "verified" || f.status === "paid").length;
        
        return {
            id: `${title}-${first.feeType}-${first.amount}`, 
            title,
            type: first.feeType,
            amount: first.amount,
            academicYear: first.academicYear || "",
            semester: first.semester || "N/A",
            dueDate: first.dueDate,
            isRequiredForClearance: first.isRequiredForClearance,
            totalStudents: feeList.length,
            paidCount,
            description: first.description
        };
        });
    }, [rawFees]);

 
    return {
        rawFees,
        aggregatedFees,
        groupedFees,
        isLoading,
        refetchFees
    }
}