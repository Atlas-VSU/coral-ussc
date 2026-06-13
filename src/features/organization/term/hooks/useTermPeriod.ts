"use client";

import { useEffect } from "react";
import { useTermStore } from "../store";
import { getAllTerms } from "@/firebase/term";
import { Term } from "../types";

/**
 * Single hook for academic periods.
 *
 * - `all`         — every period, sorted newest first
 * - `current`     — the one marked is_current in the DB (read-only reference)
 * - `selected`    — what the user has picked (defaults to current on first load)
 * - `setSelected` — lets any component switch the active selection
 */
export function useTermPeriod() {
    const {
        all,
        active,
        selected,
        loading,
        error,
        setAll,
        setActive,
        setSelected,
        setLoading,
        setError,
    } = useTermStore();

    const refresh = async () => {
        setLoading(true);
        try {
            
            const terms = await getAllTerms() as Term[];

            if (!terms) {
                setError("Failed to load periods");
                return;
            }

            const mapped: Term[] = terms.map((d) => ({
                id: d.id,
                AY: d.AY,
                semester: d.semester,
                isActive: d.isActive,
                metadata: d.metadata,
                isDeleted: d.isDeleted,
            }));

            setAll(mapped);

            const activePeriod = mapped.find((p) => p.isActive) ?? mapped[0] ?? null;
            if (activePeriod) {
                setActive(activePeriod);             // permanent reference to the DB-active period
                if (!selected || !mapped.some((p) => p.id === selected.id)) {
                    setSelected(activePeriod);         // default selection
                }
            }
        } catch (err: any) {
            setError(err?.message ?? "Failed to load periods");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (all.length > 0) return; // already loaded — skip refetch
        refresh();
    }, []);

    return { all, active, selected, loading, error, setSelected, refresh };
}