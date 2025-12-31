import React, { useState, useEffect, useMemo } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { useFrappeAuth } from "frappe-react-sdk";
import { menuItems } from "../data/menu";

const Sidebar = () => {
  const { currentUser } = useFrappeAuth();

  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  return (
    <>
      <aside
        className={`bg-white border-r border-slate-200 fixed lg:relative z-20 transition-all duration-300 h-screen overflow-hidden ${isSidebarOpen ? "w-72" : "w-24"
          }`}
      >
        <div className="p-8 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-200 transform rotate-3">
              IA
            </div>
            {isSidebarOpen && (
              <span className="font-black text-xl tracking-tighter text-slate-900">
                InfintrixAtlas
              </span>
            )}
          </div>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(`/${item.id}`);
              }}
              className={`cursor-pointer w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 ${location.pathname.includes(item.id)
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 scale-105"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <item.icon
                size={22}
                className={
                  item.highlight && activeTab !== item.id
                    ? "text-indigo-500 animate-pulse"
                    : ""
                }
              />
              {isSidebarOpen && (
                <span className="text-sm flex items-center justify-between flex-1">
                  {item.label}
                  {item.highlight && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-black ${activeTab === item.id
                          ? "bg-indigo-400 text-white"
                          : "bg-indigo-100 text-indigo-700"
                        }`}
                    >
                      AI
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-8">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center px-5 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${
                isSidebarOpen ? "rotate-180" : ""
              }`}
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="absolute bottom-8 left-0 right-0 px-8">
          <div
            className={`bg-slate-50 rounded-2xl p-4 flex items-center space-x-3 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              PM
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                {currentUser}
              </div>
              <div className="text-[10px] text-slate-400">
                Upgrade Available
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
