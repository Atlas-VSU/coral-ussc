"use client";

import { useEffect, useState } from "react";
import {
  type ProgramOption,
} from "../constants";

/**
 * Fetches the live program list from `/api/public/programs`.
 */
export function useProgramOptions() {
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [programLoadError, setProgramLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPrograms = async () => {
      setIsLoadingPrograms(true);
      setProgramLoadError(null);

      try {
        const response = await fetch("/api/public/programs");
        const result = await response.json();

        if (!response.ok || !result.success || !Array.isArray(result.programs)) {
          throw new Error(result.error || "Failed to fetch programs.");
        }

        const mapped: ProgramOption[] = result.programs
          .map(
            (program: {
              id: string;
              name?: string;
              acronym?: string;
              shortName?: string;
              code?: string;
            }) => ({
              value: program.id,
              label:
                program.name ||
                program.shortName ||
                program.acronym ||
                program.code ||
                program.id,
            })
          )
          .sort((a: ProgramOption, b: ProgramOption) =>
            a.label.localeCompare(b.label)
          );

        if (active && mapped.length > 0) {
          setProgramOptions(mapped);
        }
      } catch (error) {
        console.error("Error loading programs:", error);
        if (active) {
          setProgramLoadError(
            "Unable to load programs right now. Please try again later."
          );
        }
      } finally {
        if (active) setIsLoadingPrograms(false);
      }
    };

    void loadPrograms();

    return () => {
      active = false;
    };
  }, []);

  return { programOptions, isLoadingPrograms, programLoadError };
}
