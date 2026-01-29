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
