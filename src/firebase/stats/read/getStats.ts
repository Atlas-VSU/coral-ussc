import { db } from "@/firebase/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { StatsData } from "../create/addStats";


export const getStats = async (statId: string) => { 
        try {
            const docRef = doc(db, "stats", statId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as StatsData;
            } else {
                console.log(`No stats found for statId: ${statId}`);
                return null;
            }
        } catch (error) {
            console.error("Error fetching stats: ", error);
            throw new Error("Failed to fetch stats. Please try again.");
        }
}