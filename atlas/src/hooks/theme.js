import { useEffect, useState } from "react"


export function useTheme() {
	const [mode, setMode] = useState(() => {
		return localStorage.getItem("theme") || "light"
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

	const state = {
		mode,
		isDark: mode === "dark",
		toggle: () => setMode(m => (m === "dark" ? "light" : "dark")),
		setMode,
	}
	return state
}
