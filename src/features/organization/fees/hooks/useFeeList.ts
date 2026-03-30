"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AggregatedFee, Fee } from "../types"
import { fetchFeesForOrg, getTotalCollectedAmount, getTotalPaidAmount } from "@/firebase/fees";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentUserData } from "@/firebase";
import { cacheService } from "@/services/cacheService";
import { FeeItem } from "../types";

export function useFeeList() {
    const [rawFees, setRawFees] = useState<FeeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCollected, setTotalCollected] = useState<number>(0);
    const [totalFees, setTotalFees] = useState<number>(0);
    const [totalStudents, setTotalStudents] = useState<number>(0);
    
    const [aggregatedFees, setAggregatedFees] = useState<AggregatedFee[]>([]);

    useEffect(() => {
        const loadFees = async() => {
            setIsLoading(true)
            try {
                const user = await getCurrentUserData();
                if(!user) 
                    throw new Error("Not Authenticated!");
                
                const data = await fetchFeesForOrg(user.uid) as unknown as FeeItem[];
                setTotalFees(data.length);
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
            const groupKey = `${currentFee.title}-${currentFee.semester}-${currentFee.academicYear}`;

            if(!accumulator[groupKey]) {
                accumulator[groupKey] = [];
            }

            accumulator[groupKey].push(currentFee);
            
            return accumulator;
        }, {} as Record<string, FeeItem[]>);
    }, [rawFees])

    const refetchFees = useCallback(() => {
        const loadFees = async() => {
            setIsLoading(true)
            try {
                const user =  await getCurrentUserData();
                if(!user) 
                    throw new Error("Not Authenticated!");
                
                // Invalidate cache for hard refresh
                const cacheKey = `fees:org:${user.uid}`;
                cacheService.invalidate(cacheKey);

                const data = await fetchFeesForOrg(user.uid) as unknown as FeeItem[];
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


    useEffect(() => {
        const fetchTotalCollected = async () => {
            const user = await getCurrentUserData();
            if(!user) 
                throw new Error("Not Authenticated!");
            
            const data = await getTotalCollectedAmount(user.uid);
            setTotalCollected(data);
        }
        fetchTotalCollected();
    }, [])

    useEffect(() => {
        const fetchAggregatedData = async () => {
            if (!rawFees || !Array.isArray(rawFees)) {
                setAggregatedFees([]);
                return;
            }

            // 1. Group the fees synchronously
            const groups = (rawFees as FeeItem[]).reduce((acc, fee) => {
                const groupKey = `${fee.title}-${fee.semester}-${fee.academicYear}`;
                acc[groupKey] = fee;
                return acc;
            }, {} as Record<string, FeeItem>);

            // 2. Map to an array of Promises and wait for all to resolve
            let sumStudents = 0;
            const feePromises = Object.entries(groups).map(async ([groupKey, fee]) => {
                const totalPaid = await getTotalPaidAmount(fee.id);
                sumStudents += fee.totalStudents;
                
                return {
                    id: `${groupKey}-${fee.feeType}-${fee.amount}`, 
                    title: fee.title,
                    type: fee.feeType,
                    amount: fee.amount,
                    academicYear: fee.academicYear || "",
                    semester: fee.semester || "N/A",
                    dueDate: fee.dueDate,
                    isRequiredForClearance: fee.isRequiredForClearance,
                    totalStudents: fee.totalStudents,
                    paidCount: totalPaid,
                    description: fee.description
                };
            });

            const results = await Promise.all(feePromises);
            setAggregatedFees(results);
            setTotalStudents(sumStudents);
        };

        fetchAggregatedData();
    }, [rawFees]); // Runs whenever rawFees changes


 
    return {
        rawFees,
        aggregatedFees,
        groupedFees,
        isLoading,
        totalCollected,
        totalFees,
        totalStudents,
        refetchFees
    }
}