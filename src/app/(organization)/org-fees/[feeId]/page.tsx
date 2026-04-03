"use client";

import FeesRosterPage from "@/features/organization/fees-roster/components/FeesRosterPage";
import { useSearchParams } from "next/navigation";

export default function FeesRoster() {
    const searchParams = useSearchParams();

    const feeItemId = searchParams.get('feeItemId') ?? "";

    //return <FeesRosterPage title={title} academicYear={academicYear} semester={semester} />;
    return <FeesRosterPage feeItemId={feeItemId} />;
}