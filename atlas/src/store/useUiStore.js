import { useMemo } from "react";
import { create } from "zustand";

const getStoredTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  return localStorage.getItem("theme") || "light";
};

const getStoredSidebarState = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const saved = localStorage.getItem("sidebarOpen");
  return saved !== null ? JSON.parse(saved) : false;
};

const persistTheme = (mode) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", mode);
  }
};

const persistSidebarState = (isSidebarOpen) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }
};

export const useUiStore = create((set) => ({
  mode: getStoredTheme(),
  isSidebarOpen: getStoredSidebarState(),
  setMode: (mode) => {
    persistTheme(mode);
    set({ mode });
  },
  toggleTheme: () =>
    set((state) => {
      const mode = state.mode === "dark" ? "light" : "dark";
      persistTheme(mode);
      return { mode };
    }),
  setSidebarOpen: (isSidebarOpen) => {
    persistSidebarState(isSidebarOpen);
    set({ isSidebarOpen });
  },
  toggleSidebar: () =>
    set((state) => {
      const isSidebarOpen = !state.isSidebarOpen;
      persistSidebarState(isSidebarOpen);
      return { isSidebarOpen };
    }),
}));

export const useThemeStore = () => {
  const mode = useUiStore((state) => state.mode);
  const setMode = useUiStore((state) => state.setMode);
  const toggle = useUiStore((state) => state.toggleTheme);

  return useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );
};

export const useSidebarStore = () => {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return useMemo(
    () => ({
      isSidebarOpen,
      setSidebarOpen,
      toggleSidebar,
    }),
    [isSidebarOpen, setSidebarOpen, toggleSidebar],
  );
};
