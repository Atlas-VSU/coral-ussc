"use client";

import { useEffect, useState } from "react";
import { Term } from "../types";
import { getAllTerms } from "@/firebase/term";

export function useTermPeriodData() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await getAllTerms() as Term[];
      setTerms(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllTerms()
      .then((list) => {
        if (!cancelled) setTerms(terms);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { terms, loading, refresh };
}