"use client";

import { useEffect, useState } from "react";

export interface ProgramOption {
  value: string;
  label: string;
}

const FALLBACK: ProgramOption[] = [
  { value: "bscs", label: "Bachelor of Science in Computer Science" },
  { value: "bsit", label: "Bachelor of Science in Information Technology" },
];

export function useUpdateProgramOptions() {
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [programLoadError, setProgramLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoadingPrograms(true);
      setProgramLoadError(null);
      try {
        const res = await fetch("/api/public/programs");
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.programs)) {
          throw new Error(data.error || "Failed to load programs.");
        }
        const mapped: ProgramOption[] = data.programs
          .map((p: any) => ({
            value: p.id,
            label: p.name || p.shortName || p.acronym || p.id,
          }))
          .sort((a: ProgramOption, b: ProgramOption) =>
            a.label.localeCompare(b.label)
          );
        setProgramOptions(mapped.length > 0 ? mapped : FALLBACK);
      } catch {
        setProgramLoadError("Unable to load live programs. Using fallback list.");
        setProgramOptions(FALLBACK);
      } finally {
        setIsLoadingPrograms(false);
      }
    };
    void load();
  }, []);

  return { programOptions, isLoadingPrograms, programLoadError };
}
