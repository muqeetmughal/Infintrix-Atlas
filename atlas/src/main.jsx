import "./index.css";
import ReactDOM from 'react-dom/client'
import App from "./App.jsx";
import React from "react";

if (import.meta.env.DEV) {
  fetch("/api/method/infintrix_atlas.www.atlas.get_context_for_dev", {
    method: "POST",
  })
    .then((response) => response.json())
    .then((values) => {
      const v = JSON.parse(values.message);
      //@ts-expect-error
      if (!window.frappe) window.frappe = {};
      //@ts-ignore
      window.frappe.boot = v;
      // registerServiceWorker();
      ReactDOM.createRoot(document.getElementById("root")).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    });
} else {
  // registerServiceWorker();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
