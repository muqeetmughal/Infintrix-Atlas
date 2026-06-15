import { useTheme } from "./ThemeContext"
import { ConfigProvider, theme as antdTheme } from "antd";
import { useMemo } from "react";

export function AntdThemeProvider({
    children,
}) {

    const {isDark} = useTheme()

    const themeConfig = useMemo(() => ({
        algorithm: isDark
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
            colorBgBase: isDark ? "#0f172a" : "#ffffff",
            colorTextBase: isDark ? "#e5e7eb" : "#111827",
        },
    }), [isDark])

    return (
        <ConfigProvider
            theme={themeConfig}
            prefixCls="infintrix-atlas"
        >
            {children}

        </ConfigProvider>
    )
}
