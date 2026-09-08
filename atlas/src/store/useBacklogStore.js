import { create } from "zustand";

const useBacklogStore = create((set) => ({
  selectedTasks: new Set(),
  isBacklogExpanded: true,
  showBacklogCreator: false,
  cycleModal: null,

  toggleTaskSelection: (taskId, ctrlKey) =>
    set((state) => {
      if (!ctrlKey) return { selectedTasks: new Set() };
      const next = new Set(state.selectedTasks);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return { selectedTasks: next };
    }),
  clearTaskSelection: () => set({ selectedTasks: new Set() }),
  toggleBacklogExpanded: () =>
    set((s) => ({ isBacklogExpanded: !s.isBacklogExpanded })),
  setShowBacklogCreator: (show) => set({ showBacklogCreator: show }),
  setCycleModal: (modal) => set({ cycleModal: modal }),
}));

export default useBacklogStore;
