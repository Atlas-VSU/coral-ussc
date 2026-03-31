import { db } from "@/firebase/firebase.config";
import { collection, doc, getCountFromServer, query, setDoc, where } from "firebase/firestore";

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
            const q = query(collection(db, "users"), where("orgId", "==", statsData.orgId), where("role", "==", "user"), where("isDeleted", "==", false));
            const students = await getCountFromServer(q);
            statsData.totalStudents = students.data().count;
        }
        const docRef = doc(db, "stats", customId);
        await setDoc(docRef, statsData);
        
        console.log(`Successfully wrote stats with ID: ${customId}`);
    } catch (error) {
        console.error("Error writing stats: ", error);
    }
}
