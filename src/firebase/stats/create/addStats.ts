import { db } from "@/firebase/firebase.config";
import { getCurrentUserCount } from "@/firebase/users";
import { doc, setDoc } from "firebase/firestore";

export type StatsData = {
    id: string;
    orgId: string;
    totalStudents: number;
    totalFines: number;
    totalFees: number;
    totalCollectedFines: number;
    totalCollectedFees: number;
    totalUnpaidFines: number;
    totalUnpaidFees: number;
}

export const createStats = async (customId: string, statsData: StatsData) => {
    try {
        if (statsData.totalStudents === 0) {
            const students = await getCurrentUserCount();
            statsData.totalStudents = students || 0;
        }
        const docRef = doc(db, "stats", customId);
        await setDoc(docRef, statsData);
        
    } catch (error) {
        console.error("Error writing stats: ", error);
    }
}
