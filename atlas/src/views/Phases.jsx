import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  Circle,
  Clock,
  ChevronRight,
  X,
  LayoutDashboard,
  Layers,
  CheckSquare,
  Users,
  Calendar,
  Zap,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  Activity,
  Plus,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { Button, Select, Space } from "antd";
import {
  useFrappeCreateDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import { useQueryParams } from "../hooks/useQueryParams";
// --- Hierarchy/Status Configuration ---
const STATUS_CONFIG = {
  Completed: {
    icon: Check,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  Active: {
    icon: Activity,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950",
    border: "border-indigo-500 dark:border-indigo-700",
  },
  Planned: {
    icon: Circle,
    color: "text-slate-300 dark:text-slate-600",
    bg: "bg-white dark:bg-slate-900",
    border: "border-slate-100 dark:border-slate-800",
  },
};

// --- Mock API Data ---
const MOCK_PHASES = [
  {
    id: "PH-01",
    sequence: 1,
    title: "Discovery",
    status: "Completed",
    start_date: "2026-01-10",
    end_date: "2026-01-25",
    completion_percentage: 100,
    tasks: 12,
    cycles: 2,
  },
  {
    id: "PH-02",
    sequence: 2,
    title: "Architecture",
    status: "Completed",
    start_date: "2026-01-26",
    end_date: "2026-02-10",
    completion_percentage: 100,
    tasks: 8,
    cycles: 1,
  },
  {
    id: "PH-03",
    sequence: 3,
    title: "Implementation",
    status: "Active",
    start_date: "2026-02-11",
    end_date: "2026-03-30",
    completion_percentage: 45,
    tasks: 42,
    cycles: 4,
  },
  {
    id: "PH-04",
    sequence: 4,
    title: "UAT & Testing",
    status: "Planned",
    start_date: "2026-04-01",
    end_date: "2026-04-15",
    completion_percentage: 0,
    tasks: 15,
    cycles: 2,
  },
  {
    id: "PH-05",
    sequence: 5,
    title: "Go-Live",
    status: "Planned",
    start_date: "2026-04-16",
    end_date: "2026-04-20",
    completion_percentage: 0,
    tasks: 5,
    cycles: 1,
  },
];

// --- Shared Components ---

const Badge = ({ children, variant = "neutral" }) => {
  const themes = {
    neutral:
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    success:
      "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800",
    info: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800",
    warning:
      "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${themes[variant]}`}
    >
      {children}
    </span>
  );
};

export default function Phases() {
  const qp = useQueryParams();
  const project = qp.get("project") || null;
  const selected_task = qp.get("selected_task") || null;
  const [activeSection, setActiveSection] = useState("Phases");
  const [selectedPhase, setSelectedPhase] = useState(null);

  const createMutation = useFrappeCreateDoc();
  const updateMutation = useFrappeUpdateDoc();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const phases_of_project_query = useFrappeGetDocList(
    "Project Phase",
    {
      fields: ["*"],
      filters: [["project", "=", project]],
      limit: 0,
      orderBy: {
        field: "sequence",
        order: "asc",
      },
    },
    project ? ["phases_of_project", project] : null,
  );

  const phase_tasks_query = useFrappeGetDocList(
    "Task",
    {
      fields: ["*"],
      filters: [["custom_phase", "=", selectedPhase ? selectedPhase.name : ""]],
      limit: 0,
    },
    selectedPhase?.name ? ["phase_tasks", selectedPhase] : null,
  );

  // console.log("phase_tasks_query", phase_tasks_query.data);
  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    createMutation
      .createDoc("Task", {
        subject: newTaskTitle,
        project: project,
        custom_phase: selectedPhase.name,
      })
      .then((res) => {
        setNewTaskTitle("");
        phases_of_project_query.mutate();
        phase_tasks_query.mutate();
      });
  };

  const phases = phases_of_project_query.data || [];
  const tasks = phase_tasks_query.data || [];
  const activePhase = useMemo(
    () => phases.find((p) => p.status === "Active"),
    [phases],
  );
  const selectedPhaseTasks = useMemo(
    () => tasks.filter((t) => t.custom_phase === selectedPhase?.name),
    [tasks, selectedPhase, selected_task],
  );
  const selectedPhaseProgress = useMemo(() => {
    if (!selectedPhase) return 0;
    const total = selectedPhaseTasks.length;
    const completed = selectedPhaseTasks.filter(
      (t) => t.status === "Completed",
    ).length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }, [selectedPhaseTasks, selectedPhase, selected_task]);
  console.log("selectedPhaseProgress", selectedPhaseProgress);
  if (phases.length === 0) {
    return (
      <div className="p-6 sm:p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-white/60 dark:bg-slate-900/40">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          No phases found for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-indigo-100 dark:selection:bg-indigo-900">
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeSection === "Phases" ? (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
              {/* <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                  <button className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                    Edit Hierarchy
                  </button>
                  <Button
                    onClick={() => {
                      createMutation
                        .createDoc("Project Phase", { project })
                        .then(() => phases_of_project_query.mutate());
                    }}
                    className="w-full sm:w-auto bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-200 dark:shadow-slate-900/50"
                  >
                    <Plus size={16} /> New Phase
                  </Button>
                </div>
              </header> */}

              {phases.length === 0 ? (
                <div className="p-6 sm:p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-white/60 dark:bg-slate-900/40">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    No phases found for this project.
                  </p>
                </div>
              ) : (
                <div className="relative overflow-x-auto pt-2 no-scrollbar">
                  {/* Desktop Horizontal Timeline */}
                  <div className="hidden md:flex items-start min-w-[760px] lg:min-w-0 px-2">
                    {phases.map((phase, idx) => {
                      const config =
                        STATUS_CONFIG[phase.status] || STATUS_CONFIG.Planned;
                      const isLast = idx === phases.length - 1;

                      return (
                        <div
                          key={phase.name || phase.id || idx}
                          className="shrink-0 w-44 group relative"
                        >
                          {!isLast && (
                            <div
                              className={`absolute top-6 left-1/2 w-36 h-[2px] ${
                                phase.status === "Completed"
                                  ? "bg-emerald-200 dark:bg-emerald-900"
                                  : "bg-slate-200 dark:bg-slate-800"
                              }`}
                            />
                          )}

                          <div
                            onClick={() => setSelectedPhase(phase)}
                            className={`relative flex flex-col items-center text-center cursor-pointer transform transition-all duration-300 ${
                              phase.status === "Active"
                                ? "scale-105"
                                : "hover:scale-[1.03]"
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-md transition-all flex-shrink-0 ${config.bg} ${config.color} ${
                                phase.status === "Active"
                                  ? "ring-4 ring-indigo-100 dark:ring-indigo-900"
                                  : ""
                              }`}
                            >
                              {phase.status === "Active" ? (
                                <div className="relative w-6 h-6">
                                  <Activity
                                    size={24}
                                    className="animate-pulse"
                                  />
                                  <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20" />
                                </div>
                              ) : (
                                <config.icon size={22} />
                              )}
                            </div>

                            <div className="mt-3 space-y-1 px-2 min-w-0 max-w-full">
                              <h4
                                className={`text-xs sm:text-sm font-black truncate ${
                                  phase.status === "Planned"
                                    ? "text-slate-400 dark:text-slate-500"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {phase.title}
                              </h4>
                              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                                {phase.start_date}
                              </div>
                              {phase.status === "Active" && (
                                <div className="mt-2 w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500"
                                    style={{
                                      width: `${phase.completion_percentage || 0}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Vertical Timeline */}
                  <div className="md:hidden space-y-3">
                    {phases.map((phase, idx) => {
                      const config =
                        STATUS_CONFIG[phase.status] || STATUS_CONFIG.Planned;
                      return (
                        <div
                          key={phase.name || phase.id || idx}
                          onClick={() => setSelectedPhase(phase)}
                          className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 flex items-center justify-between transition-all ${
                            phase.status === "Active"
                              ? "border-indigo-500 dark:border-indigo-700 shadow-md"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}
                            >
                              <config.icon size={18} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black truncate">
                                {phase.title}
                              </h4>
                              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                {phase.status}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 dark:text-slate-600"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedPhase && (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/40">
                    <div className="min-w-0">
                      <Badge
                        variant={
                          selectedPhase?.status === "Completed"
                            ? "success"
                            : selectedPhase?.status === "Active"
                              ? "info"
                              : "neutral"
                        }
                      >
                        Phase {selectedPhase?.sequence}
                      </Badge>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-2 truncate">
                        {selectedPhase?.title}
                      </h3>
                    </div>
                    <Space size={8}>
                      <Button
                        type="text"
                        onClick={() => {
                          window.open(
                            `/app/project-phase/${selectedPhase.name}`,
                            "_blank",
                          );
                        }}
                      >
                        <ArrowUpRight size={16} />
                      </Button>
                      <Select
                        disabled={selectedPhase?.status === "Completed"}
                        value={selectedPhase?.status || "Planned"}
                        variant="borderless"
                        popupMatchSelectWidth={false}
                        style={{
                          width: "100%",
                        }}
                        options={[
                          {
                            value: "Planned",
                            label: "Planned",
                          },
                          {
                            value: "Active",
                            label: "Active",
                          },
                          {
                            value: "Completed",
                            label: "Completed",
                          },
                        ]}
                        onChange={(value) => {
                          updateMutation
                            .updateDoc("Project Phase", selectedPhase.name, {
                              status: value,
                            })
                            .then(() => {
                              setSelectedPhase((prev) => ({
                                ...prev,
                                status: value,
                              }));
                              phases_of_project_query.mutate();
                            });
                        }}
                      />
                      <Button
                        danger
                        onClick={() => setSelectedPhase(null)}
                        icon={<X size={16} />}
                      />
                    </Space>
                  </div>

                  <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white relative overflow-hidden">
                        <div className="relative">
                          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">
                            Phase Progress
                          </div>
                          <div className="flex items-end justify-between mb-4 gap-3">
                            <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                              {selectedPhaseProgress || 0}%
                            </span>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 text-right">
                              {console.log(selectedPhase)}
                              {selectedPhaseTasks.length || 0} Total Tasks
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-1000"
                              style={{
                                width: `${selectedPhaseProgress || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <TrendingUp
                          className="absolute -right-3 -bottom-3 text-white/5"
                          size={110}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Start Date
                          </div>
                          <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                            {selectedPhase?.start_date || "-"}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Target End
                          </div>
                          <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                            {selectedPhase?.end_date || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Phase Tasks
                      </h4>

                      <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
                        <input
                          type="text"
                          placeholder="Add a new task..."
                          className="flex-1 bg-transparent text-sm font-semibold placeholder-indigo-400 outline-none text-slate-900 dark:text-white min-w-0"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <Button
                          onClick={handleCreateTask}
                          className="p-2 bg-indigo-600 text-white rounded-lg transition-all"
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                        {tasks.length > 0 ? (
                          tasks.map((task) => (
                            <div
                              key={task.name}
                              className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <CheckSquare
                                    size={16}
                                    className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <h5
                                      className="text-sm font-semibold text-slate-900 dark:text-white break-words"
                                      onClick={() => {
                                        qp.set("selected_task", task.name);
                                      }}
                                    >
                                      {task.subject}
                                    </h5>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                      {task.name}
                                    </p>
                                  </div>
                                </div>
                                <MoreVertical
                                  size={14}
                                  className="text-slate-300 dark:text-slate-600 flex-shrink-0"
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 p-4 text-center bg-slate-50 dark:bg-slate-900 rounded-xl">
                            No tasks yet. Create one to get started.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow hover:bg-indigo-600 transition-all">
                      Phase Entry / Exit Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
              <h2 className="text-xl sm:text-2xl font-black italic">
                {activeSection} Module
              </h2>
              <button
                onClick={() => setActiveSection("Phases")}
                className="mt-6 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow"
              >
                Back to Lifecycle
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

{
  /* Connected Entities */
}
{
  /* <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Phase Intelligence
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <CheckSquare
                    size={18}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                    Linked Tasks
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {phase.tasks} Items
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Zap
                    size={18}
                    className="text-amber-500 dark:text-amber-400"
                  />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                    Sprints / Cycles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {phase.cycles} Units
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </div>
            </div>
          </div> */
}
