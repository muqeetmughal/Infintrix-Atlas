import { useFrappeGetCall } from "frappe-react-sdk";
import { Search, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const search_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.global_search",
    {
      query: query,
    },
  );

  const results = search_query.data?.message || [];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setQuery("");
        setOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleNavigate = (route) => {
    setOpen(false);
    setQuery("");
    navigate(route);
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
        <Search size={16} className="text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tasks, projects…"
          onFocus={() => setOpen(true)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            Results
          </div>

          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {[
              { type: "Task", icon: "▓" },
              { type: "Project", icon: "◆" },
              { type: "Cycle", icon: "●" },
            ].map(({ type, icon }) => {
              const filtered = results.filter((item) => item.type === type);
              return filtered.length > 0 ? (
                <div key={type}>
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <span className="text-slate-400">{icon}</span> {type}s
                  </h3>
                  <ul className="space-y-1">
                    {filtered.map((item, i) => (
                      <li
                        key={i}
                        onClick={() => handleNavigate(item.route)}
                        className="px-3 py-2 text-sm cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition duration-150 border-l-2 border-transparent hover:border-blue-500"
                      >
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })}

            {results.length === 0 && query && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}
          </div>

          <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
            <span>
              Press{" "}
              <kbd className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700">
                Esc
              </kbd>{" "}
              to close
            </span>
            {results.length > 0 && (
              <span className="text-xs text-slate-400">
                {results.length} results
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
