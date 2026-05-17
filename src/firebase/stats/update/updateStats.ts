import { createStats, StatsData } from "../create/addStats";
import { getStats } from "../read/getStats";
import { getCurrentUserData } from "@/firebase/users";

export const updateFineStats = async (customId: string, toAdd?: number, toDeduct?: number, toWaive?: number) => { 
    try {
        let statsData = null;
        statsData = await getStats(customId) as StatsData;
        if (statsData) {
            if (toAdd) {
                statsData.totalUnpaidFines += toAdd;
                statsData.totalFines += toAdd;
            }
            if (toDeduct) { 
                statsData.totalUnpaidFines -= toDeduct;
                statsData.totalCollectedFines += toDeduct;
            }
            //Since waiving means no collection, we only deduct from total fines and total unpaid fines.
            if(toWaive){
                statsData.totalUnpaidFines -= toWaive;
                statsData.totalFines -= toWaive;
            }
        } else {
            const currUser = await getCurrentUserData();
            statsData = {
                id: customId,
                orgId: currUser?.uid,
                totalStudents: 0,
                totalFines: toAdd ? toAdd : 0,
                totalFees: 0,
                totalCollectedFines: toDeduct ? toDeduct : 0,
                totalCollectedFees: 0,
                totalUnpaidFines: toAdd ? toAdd : 0,
                totalUnpaidFees: 0,
            } as StatsData;
        }
        await createStats(customId, statsData);
    }catch(error){
        console.error("Error updating fine stats: ", error);
    }
}


export const updateFeeStats = async (customId: string, toAdd?: number, toDeduct?: number) => { 
    try {
        let statsData = null;
        statsData = await getStats(customId) as StatsData;
        if (statsData) {
            if (toAdd) {
                statsData.totalUnpaidFees += toAdd;
                statsData.totalFees += toAdd;
            }
            if (toDeduct) { 
                statsData.totalUnpaidFees -= toDeduct;
                statsData.totalCollectedFees += toDeduct;
            }
        } else {
            const currUser = await getCurrentUserData();
            statsData = {
                id: customId,
                orgId: currUser?.uid ,
                totalStudents: 0,
                totalFines: 0,
                totalFees: toAdd ? toAdd : 0,
                totalCollectedFines: 0,
                totalCollectedFees: toDeduct ? toDeduct : 0,
                totalUnpaidFines: 0,
                totalUnpaidFees: toAdd ? toAdd : 0,
            } as StatsData;
        }
        await createStats(customId, statsData);
    }catch(error){
        console.error("Error updating fine stats: ", error);
    }
}


export const updateStudentStats = async (customId: string, toAdd?: number, toDeduct?: number) => { 
    try {
        let statsData = null;
        statsData = await getStats(customId) as StatsData;
        if (statsData) {
            if (toAdd) {
                statsData.totalStudents += toAdd;
            }
            if (toDeduct) { 
                statsData.totalUnpaidFees -= toDeduct;
            }
        } else {
            const currUser = await getCurrentUserData();
            statsData = {
                id: customId,
                orgId: currUser?.uid ,
                totalStudents: toAdd ? toAdd : toDeduct? toDeduct : 0,
                totalFines: 0,
                totalFees: 0,
                totalCollectedFines: 0,
                totalCollectedFees: 0,
                totalUnpaidFines: 0,
                totalUnpaidFees: 0,
            } as StatsData;
        }
        await createStats(customId, statsData);
    }catch(error){
        console.error("Error updating fine stats: ", error);
    }
}