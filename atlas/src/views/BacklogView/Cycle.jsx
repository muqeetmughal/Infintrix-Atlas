import { useSearchParams } from "react-router-dom";
import DroppableZone from "./DroppableZone";
import { useState } from "react";
import { Archive, CheckCheck, ChevronRight, Clock, MenuIcon, Plus, Trash, Zap } from "lucide-react";
import dayjs from "dayjs";
import Badge from "./Badge";
import { Button, Dropdown } from "antd";

const Cycle = ({ cycle }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const cycle_tasks = cycle?.tasks || [];
  const hasNoWorkItems = cycle_tasks.length === 0;
  const isActive = cycle.status === "Active";
  return (
    <DroppableZone
      key={cycle.name}
      id={cycle.name}
      data={"cycle"}
      isOverColor="bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400 dark:ring-indigo-500"
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-600 transition-all"
    >
      <div className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-2 flex-1 space-y-1">
          <div className="flex items-center gap-4">
            <ChevronRight
              onClick={() => setIsExpanded(!isExpanded)}
              size={20}
              className={`text-slate-400 dark:text-slate-500 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </div>
          <div
            className={`p-2 rounded-xl ${
              cycle.status === "Active"
                ? "bg-indigo-600 text-white shadow-lg"
                : cycle.status === "Completed"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : cycle.status === "Planned"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : cycle.status === "Archived"
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
            }`}
          >
            {cycle.status === "Active" ? (
              <Zap size={20} />
            ) : cycle.status === "Completed" ? (
              <CheckCheck size={20} />
            ) : cycle.status === "Planned" ? (
              <Clock size={20} />
            ) : cycle.status === "Archived" ? (
              <Archive size={20} />
            ) : (
              <Clock size={20} />
            )}
          </div>
          <div className="flex items-center">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-none">
              {cycle.cycle_name ?? cycle.name}{" "}
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                {dayjs(cycle.start_date).format("MMM D")} —{" "}
                {dayjs(cycle.end_date).format("MMM D")}
              </span>
              <small className="text-xs font-light">
                ({cycle_tasks.length} Work Items)
              </small>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                className={
                  cycle.status === "Active"
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800"
                    : cycle.status === "Completed"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"
                      : cycle.status === "Planned"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800"
                        : cycle.status === "Archived"
                          ? "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700"
                }
              >
                {cycle.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isExpanded &&
            cycle.status == "Planned" &&
            cycle_tasks.length === 0 && (
              <Button
                type="text"
                size="small"
                icon={<Trash size={16} />}
                danger
                onClick={() => {
                  deleteMutation.deleteDoc("Cycle", cycle.name).then(() => {
                    cycles_query3.mutate();
                  });
                }}
              >
                Delete
              </Button>
            )}

          {cycle.status !== "Active" &&
            cycle.status === "Planned" &&  (
              <Button
                disabled={hasNoWorkItems}
                size="small"
                type="primary"
                onClick={() => {
                  searchParams.set("cycle", cycle.name);
                  searchParams.set("mode", "start");
                  setSearchParams(searchParams);
                }}
              >
                Start Cycle
              </Button>
            )}

          {cycle.status === "Active" && (
            <Button
              size="small"
              type="default"
              onClick={() => {
                searchParams.set("complete_cycle", cycle.name);
                setSearchParams(searchParams);
              }}
            >
              Complete
            </Button>
          )}

          <Dropdown
            trigger={"click"}
            menu={{
              onClick: ({ key }) => {
                if (key === "Edit Cycle") {
                  setCycleModal({ open: true, data: cycle });
                }
              },
              items: [
                {
                  key: "Edit Cycle",
                  label: "Edit Cycle",
                  // disabled: true,
                },
              ],
            }}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Button type="text" icon={<MenuIcon />}></Button>
            </a>
          </Dropdown>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 animate-in fade-in duration-200">
          {cycle_tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
          <button className="border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all">
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase">Plan Task</span>
          </button>
        </div>
      )}
    </DroppableZone>
  );
};

export default Cycle;
