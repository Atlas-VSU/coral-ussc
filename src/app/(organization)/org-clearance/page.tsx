"use client";

import { Button } from "@/components/ui/button";
import { seedClearanceDocuments } from "@/firebase/clearance";
import { useAuth } from "@/hooks/useAuth";

export default function OrgClearancePage() {
    const { user } = useAuth();
    const handleSeeding = async () => {
        await seedClearanceDocuments(user?.uid || "");
    }
    return (
        <div>
            <h1>Org Clearance</h1>
            {/* <Button onClick={handleSeeding}>Seed Clearance Documents</Button> */}
        </div>
    );
}