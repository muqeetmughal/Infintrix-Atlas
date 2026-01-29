import { useTheme } from "./ThemeContext"
import { ConfigProvider, theme as antdTheme } from "antd";

export function AntdThemeProvider({
    children,
}) {

    const {isDark} = useTheme()
    return (
        <ConfigProvider
            key={isDark ? "dark" : "light"}
            // theme={{
            // 	algorithm: isDark
            // 		? antdTheme.darkAlgorithm
            // 		: antdTheme.defaultAlgorithm,
            // 	token: {
            // 		...light_color_scheme,
            // 		borderRadius: 10,
            // 		wireframe: false,
            // 		fontSize: 14,
            // 	},
            // }}
            theme={{
                algorithm: isDark
                    ? antdTheme.darkAlgorithm
                    : antdTheme.defaultAlgorithm,
                // token: {
                //     colorBgBase: isDark ? "#0f172a" : "#ffffff",
                //     colorTextBase: isDark ? "#e5e7eb" : "#111827",
                // },
            }}
            prefixCls="infintrix-atlas"
        >
            {children}


        </ConfigProvider>
    )
}
