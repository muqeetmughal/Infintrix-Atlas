import { useFrappeGetCall } from "frappe-react-sdk";
import { Search, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const search_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.global_search",
    {
      query: query,
    },
  );

  console.log("Search Query Result:", search_query.data);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
        <Search size={16} className="text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search issues, projects…"
          onFocus={() => setOpen(true)}
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
          }}
          className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
          {/* Header */}
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            Recent
          </div>

          {/* Results */}
          <ul className="max-h-80 overflow-y-auto">
            {[
              "TASK-1023 Update BOM",
              "BUG-441 Invoice mismatch",
              "PROJ-9 Manufacturing Flow",
            ].map((item, i) => (
              <li
                key={i}
                className="px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                                    hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  {item}
                </span>
                <span className="text-xs text-slate-400">Issue</span>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
            Press <kbd className="px-1 border rounded">Esc</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
