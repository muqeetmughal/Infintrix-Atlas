import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, Spin, theme } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SWRDevTools } from "swr-devtools";

import "./index.css";
import App from "./App.jsx";
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

//  const { darkModeEnabled } = useSelector((state) => state.theme);
// const themeAlgorithm = React.useMemo(() => {
//   return darkModeEnabled
//     ? [theme.darkAlgorithm, theme.compactAlgorithm]
//     : [theme.compactAlgorithm];
// }, [darkModeEnabled]);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          ...light_color_scheme,
          borderRadius: 10,
          wireframe: false,
          fontSize: 14,
        },
      }}
      prefixCls="infintrix-atlas"
    >
      {/* <QueryClientProvider client={queryClient}> */}
        <SWRDevTools>
          <App />
        </SWRDevTools>
      {/* </QueryClientProvider> */}
    </ConfigProvider>
  </StrictMode>
);
