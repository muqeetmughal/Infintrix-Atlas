import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ProjectViewTabs = ({ tabs, view }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="flex items-center border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
      <div className="flex space-x-4 md:space-x-6 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const oldSearchParams = new URLSearchParams(
                searchParams.toString(),
              );
              navigate(`/tasks/${tab.id}`);
              setSearchParams(oldSearchParams);
            }}
            className={`cursor-pointer pb-2 text-sm font-semibold transition-all relative whitespace-nowrap ${
              view === tab.id
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
            {view === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 animate-in slide-in-from-left-2" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectViewTabs;
