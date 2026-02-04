import { Outlet } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  AlertCircle,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  LogOut,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
  useFrappeAuth,
  useFrappeEventListener,
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";
import { useLocation } from "react-router-dom";
import { menuItems } from "../data/menu";
import ModalGenerator from "../components/ModalGenerator";
import { useTheme } from "../context/ThemeContext";
import { Button } from "antd";
import { BellOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/query";
import useRealtime from "../hooks/realtime";
import GlobalSearch from "./GlobalSearch";

const Header = () => {
  const { toggle, isDark } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);

  const auth = useAuth();


  const notifications_logs_query = useFrappeGetDocList("Notification Log", {
    fields: ["*"],
    filters: [["document_type", "in", ["Task", "Project", "Cycle"]]],
    orderBy: {
      field: "creation",
      order: "desc",
    },
  });
    useFrappeEventListener("update_system_notifications", (data) => {
    console.log("Realtime notification received:", data);
    notifications_logs_query.mutate();
  });
  const mark_as_read_mutation = useFrappePostCall(
    "frappe.desk.doctype.notification_log.notification_log.mark_as_read",
  );

  const notifications = notifications_logs_query.data || [];

  // console.log("Current Auth:", auth);

  const markAsRead = async (notificationName) => {
    mark_as_read_mutation.call({ docname: notificationName });
    notifications_logs_query.mutate();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-10 flex items-center justify-between sticky top-0 z-10">
        <GlobalSearch/>

        <div className="flex items-center space-x-6">
          <button
            onClick={toggle}
            className="h-12 w-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-amber-200 dark:border-indigo-700 rounded-2xl flex items-center justify-center text-amber-600 dark:text-indigo-400 hover:from-amber-100 hover:to-orange-100 dark:hover:from-indigo-800/30 dark:hover:to-purple-800/30 cursor-pointer shadow-sm transition-all duration-300"
          >
            {isDark ? (
              <MoonOutlined className="text-lg" />
            ) : (
              <SunOutlined className="text-lg" />
            )}
          </button>

          <div className="relative notification-container">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 cursor-pointer shadow-sm transition-all duration-300 relative"
            >
              <BellOutlined size={36} />
              {notifications.filter((n) => n.read === 0).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-700 text-[10px] text-white flex items-center justify-center">
                  {notifications.filter((n) => n.read === 0).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-14 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.name}
                        onClick={() =>
                          notification.read === 0 &&
                          markAsRead(notification.name)
                        }
                        className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                          notification.read === 0
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <BellOutlined size={16} />
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm ${notification.read === 0 ? "font-semibold" : "font-medium"} text-slate-900 dark:text-slate-100`}
                              dangerouslySetInnerHTML={{
                                __html: notification.subject,
                              }}
                            />
                            {notification.email_content && (
                              <div
                                className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: notification.email_content,
                                }}
                              />
                            )}
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(
                                notification.creation,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className={`rounded-2xl p-2 flex items-center space-x-3 transition-opacity duration-300 opacity-100`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              {auth?.user?.user_image ? (
                <img
                  className="rounded-full"
                  src={auth.user.user_image}
                  alt="User Avatar"
                />
              ) : (
                auth.user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                {auth.user?.full_name || auth.currentUser}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {auth.user?.role_profiles?.join(", ") || "User"}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              auth.logout();
            }}
            className="h-12 w-12 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white cursor-pointer shadow-sm relative transition-colors"
          >
            <LogOut size={24} />
            {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-700" /> */}
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
