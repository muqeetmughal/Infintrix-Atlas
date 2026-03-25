import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronRight,
  Clock,
  TrendingUp,
  Layers,
  Users,
  UserPlus,
  BarChart3,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Activity,
  Info,
  Building2,
} from "lucide-react";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { useQueryParams } from "../hooks/useQueryParams";

// --- Roles Configuration ---
const ROLES = { PM: "Project Manager", STAFF: "Staff", CLIENT: "Client" };

// --- Project Detail Data (Based on provided JSON) ---
const PROJECT_DETAIL = {
  name: "PROJ-0001",
  project_name: "GSI Project",
  status: "Open",
  priority: "Medium",
  custom_execution_mode: "Kanban",
  percent_complete: 30,
  company: "Infintrix Technologies",
  creation: "2026-01-28",
  custom_enable_ai_architect: 1,
  total_sales_amount: 0,
  total_billed_amount: 0,
  actual_time: 0,
  users: [
    {
      user: "kashi@gmail.com",
      full_name: "Kashif",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kashif",
      email: "kashi@gmail.com",
    },
    {
      user: "muqeetmughal786@gmail.com",
      full_name: "Muqeet",
      image:
        "https://secure.gravatar.com/avatar/62b0decc86eb94a6c25552ebbd4268e5?d=404&s=200",
      email: "muqeetmughal786@gmail.com",
    },
  ],
};

const Badge = ({ children, variant = "neutral" }) => {
  const themes = {
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
    danger: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800",
    info: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
    locked: "bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${themes[variant]}`}
    >
      {children}
    </span>
  );
};

const SectionProjectDetail = ({ project }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  const financialMetrics = [
    {
      label: "Sales Amount",
      value: `$${project.total_sales_amount}`,
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      label: "Billed Amount",
      value: `$${project.total_billed_amount}`,
      icon: BarChart3,
      color: "text-indigo-500",
    },
    {
      label: "Actual Time",
      value: `${project.actual_time}h`,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: "Gross Margin",
      value: "0%",
      icon: TrendingUp,
      color: "text-slate-400 dark:text-slate-500",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[48px] p-10 shadow-xl dark:shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-[100px] -mr-32 -mt-32" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="locked">{project.name}</Badge>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <Building2 size={12} /> {project.company}
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">
              {project.project_name}
            </h1>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Activity size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Layers size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">
                  {project.custom_execution_mode}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-2xl border border-amber-100 dark:border-amber-800">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                  {project.priority} Priority
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={
                    364.4 - (364.4 * project.percent_complete) / 100
                  }
                  className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {project.percent_complete}%
                </span>
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  Progress
                </span>
              </div>
            </div>
            {project.custom_enable_ai_architect === 1 && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 dark:bg-indigo-700 rounded-full shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50">
                <Sparkles size={12} className="text-white animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">
                  AI Architect Enabled
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vital Signs (Financials) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {financialMetrics.map((m, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 rounded-[32px] hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all"
              >
                <div
                  className={`w-10 h-10 bg-slate-50 dark:bg-slate-800 ${m.color} rounded-xl flex items-center justify-center mb-4`}
                >
                  <m.icon size={20} />
                </div>
                <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {m.label}
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[40px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> Project Metadata
              </h3>
              <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">
                Edit Fields
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              {[
                { label: "Created On", value: project.creation },
                {
                  label: "Completion Method",
                  value: project.percent_complete_method,
                },
                { label: "Is Active", value: project.is_active },
                {
                  label: "AI Policy",
                  value:
                    project.custom_ai_policy === "1" ? "Active" : "Standard",
                },
                { label: "Frequency", value: project.frequency },
                {
                  label: "Archived",
                  value: project.custom_is_archived === 0 ? "No" : "Yes",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-3"
                >
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {item.label}
                  </span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Human Roster */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[40px] p-8 shadow-sm dark:shadow-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Project Roster
              </h3>
              <button className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                <UserPlus size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {project.users.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-[24px] group hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-700 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={u.image}
                      alt={u.full_name}
                      className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-700 shadow-sm"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${u.full_name}&background=6366f1&color=fff`;
                      }}
                    />
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {u.full_name}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate w-32">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"
                  />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
              Manage Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProjectDetail() {
  const qp = useQueryParams();
  const project = qp.get("project") || "PROJ-0001";
  const project_query = useFrappeGetDoc("Project", project);

  console.log("Project Query:", project_query.data);
  if (project_query.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Activity size={48} className="text-indigo-500 animate-spin" />
          <p className="mt-4 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Loading Project Details...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex font-sans text-slate-900 dark:text-white">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mx-auto h-full">
          <SectionProjectDetail project={project_query.data} />
          {/* <div className="p-20 border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-[64px] text-center">
            <p className="text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">
              Awaiting Data Sync from {project_query.data.name}
            </p>
            <button className="mt-8 bg-slate-900 dark:bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 dark:hover:bg-indigo-700">
              Back to Intelligence
            </button>
          </div> */}
        </div>
      </main>
    </div>
  );
}
