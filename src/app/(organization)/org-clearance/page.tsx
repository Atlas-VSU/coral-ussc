"use client";

import { Button } from "@/components/ui/button";
import ClearancePage from "@/features/organization/clearance/components/ClearancePage";
import { seedClearanceDocuments } from "@/firebase/clearance";
import { useAuth } from "@/hooks/useAuth";

export default function OrgClearancePage() {
    const { user } = useAuth();
    const handleSeeding = async () => {
        await seedClearanceDocuments(user?.uid || "");
    }
    return (
        <div>
            <ClearancePage orgId={user?.uid} />
            {/* <Button onClick={handleSeeding}>Seed Clearance Documents</Button> */}
        </div>
    );
}