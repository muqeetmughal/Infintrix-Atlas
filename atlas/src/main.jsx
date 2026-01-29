import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import App from "./App.jsx";

//  const { darkModeEnabled } = useSelector((state) => state.theme);
// const themeAlgorithm = React.useMemo(() => {
//   return darkModeEnabled
//     ? [theme.darkAlgorithm, theme.compactAlgorithm]
//     : [theme.compactAlgorithm];
// }, [darkModeEnabled]);

createRoot(document.getElementById("root")).render(
  <StrictMode>

          <App />
  </StrictMode>
);
