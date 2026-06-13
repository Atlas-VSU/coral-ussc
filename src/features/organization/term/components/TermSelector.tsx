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

export function PeriodSelector() {
    const { all, selected, setSelected } = useTermPeriod();

    if (all.length === 0) return null;

    return (
        <Select
            value={selected?.id}
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