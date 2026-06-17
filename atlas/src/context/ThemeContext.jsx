import { useEffect } from "react";
import { useThemeStore } from "../store/useUiStore";

export function ThemeProvider({ children }) {
    const { mode } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;
        if (mode === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [mode]);

    return (
        children
    );
}

export function useTheme() {
    return useThemeStore();
}
