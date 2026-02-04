import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { menuItems } from "../data/menu";

const Sidebar = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 h-screen overflow-y-auto sticky top-0 hidden lg:block ${
          isSidebarOpen ? "w-72" : "w-24"
        }`}
      >
        <div className="p-8 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src='/images/logo.png' alt="Infintrix Atlas Logo" width={50} height={50}/>
            {isSidebarOpen && (
              <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white">
                {/* cspell:disable-next-line */}
                Infintrix Atlas
              </span>
            )}
          </div>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              className={`cursor-pointer w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 ${
                location.pathname.includes(item.id)
                  ? "bg-indigo-600 dark:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 scale-105"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <item.icon
                size={22}
                className={
                  item.highlight && !location.pathname.includes(item.id)
                    ? "text-indigo-500 dark:text-indigo-400 animate-pulse"
                    : ""
                }
              />
              {isSidebarOpen && (
                <span className="text-sm flex items-center justify-between flex-1">
                  {item.label}
                  {item.highlight && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-black ${
                        location.pathname.includes(item.id)
                          ? "bg-indigo-400 dark:bg-indigo-300 text-white dark:text-indigo-900"
                          : "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
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
            className="w-full flex items-center justify-center px-5 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all duration-200"
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
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-50 pb-safe">
        <div className="flex items-center justify-around px-2 py-3">
          {menuItems.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname.includes(item.id)
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <item.icon
                  size={20}
                  className={
                    item.highlight && !location.pathname.includes(item.id)
                      ? "text-indigo-500 dark:text-indigo-400 animate-pulse"
                      : ""
                  }
                />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.highlight && (
                  <span className="absolute -top-1 right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
