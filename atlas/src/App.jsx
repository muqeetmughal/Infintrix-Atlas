import { RouterProvider } from "react-router-dom";
import "./App.css";
import { FrappeProvider } from "frappe-react-sdk";
import { router } from "./Routes";
import { SWRDevTools } from "swr-devtools";
import { useTheme } from "./hooks/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AntdThemeProvider } from "./context/AntdThemeProvider";
const light_color_scheme = {
  colorPrimary: "#16b04f",
  colorSuccess: "#42bf04",
  colorInfo: "#16804f",
  colorError: "#f9262a",
  colorWarning: "#f7aa11",
};
const dark_color_scheme = {
  colorPrimary: "#16b04f",
  colorSuccess: "#42bf04",
  colorInfo: "#16804f",
  colorError: "#f9262a",
  colorWarning: "#f7aa11",
};

function App() {
  const { isDark } = useTheme();

  const queryClient = new QueryClient();
  // Handle different Frappe versions
  const getSiteName = () => {
    // @ts-ignore
    if (window.frappe?.boot?.versions?.frappe.startsWith("14")) {
      return import.meta.env.VITE_SITE_NAME;
    }
    // @ts-ignore
    else {
      // @ts-ignore
      return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME;
    }
  };
  // SWR caching with localStorage
  function localStorageProvider() {
    const cache = localStorage.getItem("app-cache") || "[]";
    const map = new Map(JSON.parse(cache));

    window.addEventListener("beforeunload", () => {
      const entries = Array.from(map.entries());
      localStorage.setItem("app-cache", JSON.stringify(entries));
    });

    return map;
  }

  return (
    <div className="App">
      <ThemeProvider>
        <AntdThemeProvider>
          <QueryClientProvider client={queryClient}>
            <SWRDevTools>
              <FrappeProvider
                url={import.meta.env.VITE_FRAPPE_PATH ?? ""}
                socketPort={
                  import.meta.env.VITE_SOCKET_PORT
                    ? import.meta.env.VITE_SOCKET_PORT
                    : undefined
                }
                siteName={getSiteName()}
                swrConfig={{
                  errorRetryCount: 2,
                  provider: localStorageProvider,
                }}
              >
                <RouterProvider router={router} />
              </FrappeProvider>
            </SWRDevTools>
          </QueryClientProvider>
        </AntdThemeProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
