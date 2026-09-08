import { create } from "zustand";

const usePhaseArchitect = create((set) => ({
  phase: null,
  open: (phase) => set({ phase }),
  close: () => set({ phase: null }),
}));

export default usePhaseArchitect;
