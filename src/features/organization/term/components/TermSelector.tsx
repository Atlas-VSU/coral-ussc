"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Term } from "../types";
import { useTermPeriod } from "../hooks/useTermPeriod";
import { usePathname } from "next/navigation";

// Top-level routes where term selection is allowed
const PRIMARY_ROUTES = [
  "/org-fees",
  "/org-fines",
  "/org-events",
  "/org-members",
  "/org-payments",
  "/org-clearance",
  "/org-dashboard",
];

export function PeriodSelector() {
    const { all, selected, setSelected } = useTermPeriod();
    const pathname = usePathname();

    // Disabled if we're on a sub-route like /org-fees/[id]
    const isDisabled = !PRIMARY_ROUTES.some(
        (route) => pathname === route
    );

    if (all.length === 0) return null;

    return (
        <Select
            value={selected?.id}
            disabled={isDisabled}
            onValueChange={(id) => {
                const period = all.find((p: Term) => p.id === id);
                if (period) setSelected(period);
            }}
        >
            <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
                {all.map((p: Term) => (
                    <SelectItem key={p.id!} value={p.id!}>
                        {p.AY} — {p.semester} Semester
                        {p.isActive ? " (Current)" : ""}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}