"use client";

import FeesRosterPage from "@/features/organization/fees-roster/components/FeesRosterPage";
import { useSearchParams } from "next/navigation";

export default function FeesRoster() {
    const searchParams = useSearchParams();

    const title = searchParams.get('title') ?? "";
    const academicYear = searchParams.get('academic_year') ?? "";
    const semester = searchParams.get('semester') ?? "";

    return <FeesRosterPage title={title} academicYear={academicYear} semester={semester} />;
}