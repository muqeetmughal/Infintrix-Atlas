import React, { createContext, useContext, useEffect, useState } from "react"



const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
    const [mode, setMode] = useState(() => {
        return (localStorage.getItem("theme")) || "light"
    })

    useEffect(() => {
        const root = document.documentElement
        if (mode === "dark") {
            root.classList.add("dark")
        } else {
            root.classList.remove("dark")
        }
        localStorage.setItem("theme", mode)
    }, [mode])

    return (
        <ThemeContext.Provider
            value={{
                mode,
                isDark: mode === "dark",
                toggle: () => setMode(m => (m === "dark" ? "light" : "dark")),
                setMode,
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) {
        throw new Error("useTheme must be used inside ThemeProvider")
    }
    return ctx
}
