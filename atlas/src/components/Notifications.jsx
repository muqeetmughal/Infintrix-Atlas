import React, { useEffect, useMemo, useState } from "react";
import {
  useFrappeEventListener,
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";
import { useAuth } from "../hooks/query";
import { Badge, notification } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { soundManager } from "../lib/soundManager";
import { CheckSquare, Folder, RefreshCw } from "lucide-react";

const Notifications = () => {
  const auth = useAuth();
  const [notification_api, contextHolder] = notification.useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState({});
  const [page] = useState(0);

  const PAGE_SIZE = 99999;

  const date_days_ago = useMemo(
    () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    []
  );

  const notifications_logs_query = useFrappeGetDocList(
    "Notification Log",
    {
      fields: ["*"],
      filters: [
        ["document_type", "in", ["Task", "Project", "Cycle"]],
        ["for_user", "=", auth.currentUser],
        ["read", "=", 0],
        ["creation", ">=", date_days_ago],
      ],
      orderBy: { field: "creation", order: "desc" },
      limit_start: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    },
    auth.currentUser ? ["notifications", auth.currentUser] : null
  );

  const mark_as_read_mutation = useFrappePostCall(
    "frappe.desk.doctype.notification_log.notification_log.mark_as_read"
  );

  useEffect(() => {
    document.addEventListener("pointerdown", () => soundManager.unlock(), {
      once: true,
    });
  }, []);

  useFrappeEventListener("update_system_notifications", (data) => {
    console.log("Realtime notification received:", data);
    soundManager.play("ALERT");
    notification_api.info({
      message: data.subject || "New Notification",
      description: (
        <div
          dangerouslySetInnerHTML={{
            __html:
              data.content ||
              "You have new notifications. Please check the bell icon.",
          }}
        />
      ),
      placement: "topRight",
    });
    notifications_logs_query.mutate();
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNotifications &&
        !event.target.closest(".notification-container")
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const notifications = notifications_logs_query.data || [];

  const handleNotificationClick = async (notificationItem) => {
    setLoadingNotifications((prev) => ({
      ...prev,
      [notificationItem.name]: true,
    }));

    try {
      if (notificationItem.read === 0) {
        await mark_as_read_mutation.call({ docname: notificationItem.name });
        notifications_logs_query.mutate();
      }

      const docType =
        notificationItem.document_type ||
        notificationItem.reference_type ||
        notificationItem.reference_doctype;
      const docName =
        notificationItem.document_name ||
        notificationItem.reference_name ||
        notificationItem.reference_docname ||
        notificationItem.reference_doc;

      if (!docType || !docName) return;

      if (docType === "Task") {
        // Fetch task to get project
        try {
          const res = await fetch(`/api/resource/Task/${encodeURIComponent(docName)}`);
          if (res.ok) {
            const json = await res.json();
            const project = json?.data?.project;
            if (project) {
              window.location.href = `/atlas/tasks/kanban?project=${encodeURIComponent(
                project
              )}&selected_task=${encodeURIComponent(docName)}`;
              return;
            }
          }
        } catch {}
        window.location.href = `/atlas/tasks/kanban?selected_task=${encodeURIComponent(docName)}`;
        return;
      }

      if (docType === "Project") {
        window.location.href = `/atlas/tasks/kanban?project=${encodeURIComponent(docName)}`;
        return;
      }
    } finally {
      setLoadingNotifications((prev) => ({
        ...prev,
        [notificationItem.name]: false,
      }));
    }
  };

  return (
    <div className="relative notification-container">
      {contextHolder}

      <Badge count={notifications.filter((n) => n.read === 0).length} overflowCount={PAGE_SIZE}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 cursor-pointer shadow-sm transition-all duration-300 relative"
        >
          <BellOutlined size={36} />
        </button>
      </Badge>

      {showNotifications && (
        <div className="absolute right-0 top-14 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-99999 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-linear-to-r from-blue-50 to-blue-100/50 dark:from-slate-700 dark:to-slate-600">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Notifications ({notifications.filter((n) => n.read === 0).length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notificationItem) => (
                <div
                  key={notificationItem.name}
                  onClick={() => handleNotificationClick(notificationItem)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all duration-200 ${
                    notificationItem.read === 0
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "opacity-60"
                  } ${loadingNotifications[notificationItem.name] ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      {notificationItem.document_type === "Task" && <CheckSquare size={16} />}
                      {notificationItem.document_type === "Project" && <Folder size={16} />}
                      {notificationItem.document_type === "Cycle" && <RefreshCw size={16} />}
                      {!["Task", "Project", "Cycle"].includes(notificationItem.document_type) && (
                        <BellOutlined size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          notificationItem.read === 0 ? "font-semibold" : "font-medium"
                        } text-slate-900 dark:text-slate-100 wrap-break-word`}
                        dangerouslySetInnerHTML={{ __html: notificationItem.subject }}
                      />
                      {notificationItem.email_content && (
                        <div
                          className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 wrap-break-word"
                          dangerouslySetInnerHTML={{ __html: notificationItem.email_content }}
                        />
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        {new Date(notificationItem.creation).toLocaleString()}
                      </p>
                    </div>
                    {notificationItem.read === 0 && loadingNotifications[notificationItem.name] && (
                      <div className="shrink-0 w-5 h-5">
                        <div className="animate-spin rounded-full h-full w-full border-2 border-blue-300 border-t-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <BellOutlined size={32} className="mx-auto mb-2 opacity-40" />
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
