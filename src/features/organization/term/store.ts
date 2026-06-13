import { Term } from "./types";
import { create } from "zustand";

interface TermStore {
    all:        Term[];
    active:    Term | null;  
    selected:   Term | null;
    loading:    boolean;
    error:      string | null;

    setAll:      (terms: Term[]) => void;
    setActive:  (active: Term) => void;
    setSelected: (selected: Term) => void;
    setLoading:  (loading: boolean) => void;
    setError:    (error: string) => void;
}

export const useTermStore = create<TermStore>((set) => ({
    all:      [],
    active:  null,
    selected: null,
    loading:  false,
    error:    null,

    setAll:      (all)     => set({ all }),
    setActive:  (active) => set({ active }),
    setSelected: (selected) => set({ selected }),
    setLoading:  (loading)  => set({ loading }),
    setError:    (error)    => set({ error }),
}));