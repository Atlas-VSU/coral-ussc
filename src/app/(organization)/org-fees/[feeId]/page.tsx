"use client";

import FeesRosterPage from "@/features/organization/fees/components/FeesRosterPage";
import { useSearchParams } from "next/navigation";

export default function FeesRoster() {
    const searchParams = useSearchParams();

    const title = searchParams.get('title') ?? "";
    const academicYear = searchParams.get('academic_year') ?? "";

    return <FeesRosterPage title={title} academicYear={academicYear} />;
}