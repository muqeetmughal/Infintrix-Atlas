import "./index.css";
import ReactDOM from 'react-dom/client'
import App from "./App.jsx";
import React from "react";
import relativeTime from "dayjs/plugin/relativeTime"
import dayjs from "dayjs";
dayjs.extend(relativeTime)


if (import.meta.env.DEV) {
  fetch("/api/method/infintrix_atlas.www.atlas.get_context_for_dev")
    .then((response) => response.json())
    .then((values) => {
      const data = values.message;
      const v = typeof data.boot === "string" ? JSON.parse(data.boot) : data.boot;
      //@ts-expect-error
      if (!window.frappe) window.frappe = {};
      //@ts-ignore
      window.frappe.boot = v;
      window.csrf_token = data.csrf_token;
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
