import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Wand2,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Check,
  X,
  Edit3,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Layers,
  CheckSquare,
  Save,
  UserPlus,
  RotateCcw,
  Target,
  Clock,
  Briefcase,
  ExternalLink,
  Ban,
  RefreshCcw,
} from "lucide-react";
import { useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { useSearchParams } from "react-router-dom";
import { useQueryParams } from "../hooks/useQueryParams";
import { Select } from "antd";

// --- Finite State Machine Definitions ---
const UI_STATES = {
  IDLE: "IDLE",
  DECOMPOSING: "DECOMPOSING",
  GUARDING: "GUARDING",
  BLOCKED: "BLOCKED",
  DRAFTING: "DRAFTING",
  VALIDATING: "VALIDATING",
  REVIEWING: "REVIEWING",
  CREATING: "CREATING",
  SUCCESS: "SUCCESS",
  PARTIAL_SUCCESS: "PARTIAL_SUCCESS",
  ERROR: "ERROR",
};

const PIPELINE_VISUALS = {
  [UI_STATES.IDLE]: { active: null, finished: [] },
  [UI_STATES.DECOMPOSING]: { active: 1, finished: [] },
  [UI_STATES.GUARDING]: { active: 2, finished: [1] },
  [UI_STATES.BLOCKED]: { active: 2, finished: [1], isBlocked: true },
  [UI_STATES.DRAFTING]: { active: 3, finished: [1, 2] },
  [UI_STATES.VALIDATING]: { active: 4, finished: [1, 2, 3] },
  [UI_STATES.REVIEWING]: { active: 5, finished: [1, 2, 3, 4] },
  [UI_STATES.CREATING]: { active: 6, finished: [1, 2, 3, 4, 5] },
  [UI_STATES.SUCCESS]: { active: null, finished: [1, 2, 3, 4, 5, 6] },
  [UI_STATES.PARTIAL_SUCCESS]: {
    active: 5,
    finished: [1, 2, 3, 4],
    hasFailures: true,
  },
  [UI_STATES.ERROR]: { active: null, finished: [], isError: true },
};

const PIPELINE_STEPS = [
  {
    id: 1,
    name: "Intent Decomposition",
    desc: "AI Extracting atomic requirements",
  },
  {
    id: 2,
    name: "Feasibility Guard",
    desc: "System verifying scope & capacity",
  },
  { id: 3, name: "Task Drafting", desc: "AI generating backlog items" },
  { id: 4, name: "Structural Validation", desc: "System checking integrity" },
  { id: 5, name: "Human Review", desc: "Awaiting user validation" },
  { id: 6, name: "Task Creation", desc: "Deploying records to ERPNext" },
];

const AVAILABLE_PROJECTS = [
  {
    id: "PROJ-0001",
    name: "Website Redesign",
    mode: "Scrum",
    cycles: ["Sprint 12", "Sprint 13"],
    scope: "Frontend and Auth modules",
  },
  {
    id: "PROJ-002",
    name: "Cloud Migration",
    mode: "Kanban",
    cycles: [],
    scope: "AWS Infrastructure",
  },
  {
    id: "PROJ-003",
    name: "Mobile App",
    mode: "Scrum",
    cycles: ["Q1-Release"],
    scope: "iOS/Android parity",
  },
];

const TASK_PRIORITY_COLORS = {
  Urgent: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800",
  High: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800",
  Medium: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
  Low: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700",
};

const TaskReviewCard = ({ task, onUpdate, onReject, onApprove, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState({ ...task });

  const isApproved = task.status === "APPROVED";
  const isValid = task.validation?.valid;
  const isCreated = task.creationStatus === "SUCCESS";
  const isLocked = disabled || isCreated;

  const handleSave = () => {
    onUpdate(task.id, localData);
    setIsEditing(false);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 border-2 rounded-[32px] p-6 transition-all ${
        isCreated
          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/20"
          : isApproved
          ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/20 shadow-lg shadow-indigo-100/20 dark:shadow-indigo-900/20"
          : !isValid
          ? "border-rose-200 dark:border-rose-800"
          : "border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800"
      } ${isLocked ? "opacity-80" : ""}`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                isCreated
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : isApproved
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : task.creationStatus === "FAILED"
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600"
              }`}
            >
              {isCreated
                ? "Record Created"
                : isApproved
                ? "Approved"
                : task.creationStatus === "FAILED"
                ? "Failed"
                : "Drafted"}
            </div>
            <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              Confidence: {(task.confidence * 100).toFixed(0)}%
            </div>
          </div>
          {!isLocked && !isApproved && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => onReject(task.id)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <input
              className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              value={localData.subject}
              onChange={(e) =>
                setLocalData({ ...localData, subject: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                className="bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-100"
                value={localData.priority}
                onChange={(e) =>
                  setLocalData({ ...localData, priority: e.target.value })
                }
              >
                {Object.keys(TASK_PRIORITY_COLORS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-100"
                value={localData.weight}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    weight: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Save size={14} /> Commit Changes
            </button>
          </div>
        ) : (
          <div>
            <h4
              className={`text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-2 ${
                !isValid && !isApproved && !isCreated
                  ? "line-through opacity-40"
                  : ""
              }`}
            >
              {task.subject}
            </h4>
            <div className="flex items-center gap-3">
              <span
                className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                  TASK_PRIORITY_COLORS[task.priority]
                }`}
              >
                {task.priority}
              </span>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {task.weight} Points
              </span>
            </div>
          </div>
        )}

        {!isValid && !isApproved && !isCreated && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-start gap-3">
            <AlertCircle size={16} className="text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">
                Structural Violation
              </div>
              <ul className="text-[10px] font-bold text-rose-400 dark:text-rose-500 list-disc ml-3 leading-tight">
                {task.validation?.errors?.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {task.creationStatus === "LOADING" && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
            <Loader2 size={16} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
              Creating ERPNext Record...
            </span>
          </div>
        )}

        {task.creationStatus === "FAILED" && (
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle size={14} />
            <span className="text-[10px] font-black uppercase tracking-tight">
              Deployment Failed: Record Validation Error
            </span>
          </div>
        )}

        {isCreated && (
          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckSquare size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Doc: T-2026-001 Verified
              </span>
            </div>
            <ExternalLink
              size={14}
              className="text-emerald-400 dark:text-emerald-500 cursor-pointer"
            />
          </div>
        )}

        {!isLocked && !isEditing && !isApproved && !isCreated && (
          <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-end">
            <button
              disabled={!isValid}
              onClick={() => onApprove(task.id)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                !isValid
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
              }`}
            >
              <Check size={16} /> Approve Suggested Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AIArchitect() {
  const qp = useQueryParams();

  const project = qp.get("project") || null;
  const [uiState, setUiState] = useState(UI_STATES.IDLE);
  const [prompt, setPrompt] = useState("");
  const [intents, setIntents] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [selectedProjectId] = useState(AVAILABLE_PROJECTS[0].id);
  const [selectedCycle, setSelectedCycle] = useState("");

  const cycles_options_query = useFrappeGetDocList("Cycle", {
    filters: { project: project },
    fields: ["name as value", "name as label"],
    limit_page_length: 100,
  }, ["cycles-options", project]);

  const { call: openPipeline } = useFrappePostCall(
    "infintrix_atlas.api.ai_pipeline.open_ai_pipeline"
  );
  const { call: createTasks } = useFrappePostCall(
    "infintrix_atlas.api.ai.create_from_ai"
  );

  const selectedProject = useMemo(
    () => AVAILABLE_PROJECTS.find((p) => p.id === selectedProjectId),
    [selectedProjectId]
  );

  const validateTask = useCallback((task) => {
    const errors = [];
    if (!task.subject || task.subject.length < 5)
      errors.push("Subject must be at least 5 characters");
    if (!task.priority) errors.push("Priority is required");
    if (!task.weight || task.weight <= 0)
      errors.push("Weight must be greater than 0");
    return { valid: errors.length === 0, errors };
  }, []);

  useEffect(() => {
    let timeout;

    const handleTransition = async () => {
      try {
        switch (uiState) {
          case UI_STATES.DECOMPOSING:
            timeout = setTimeout(() => {
              setIntents([
                { id: "I1", text: `Optimize ${selectedProject.scope}` },
                { id: "I2", text: "Define security baseline" },
              ]);
              setUiState(UI_STATES.GUARDING);
            }, 1200);
            break;

          case UI_STATES.GUARDING:
            timeout = setTimeout(() => {
              if (prompt.trim().split(/\s+/).length < 3) {
                setUiState(UI_STATES.BLOCKED);
              } else {
                setUiState(UI_STATES.DRAFTING);
              }
            }, 1000);
            break;

          case UI_STATES.DRAFTING:
            timeout = setTimeout(() => {
              const raw = [
                {
                  id: "T1",
                  subject: "Establish S3 bucket lifecycle policy",
                  priority: "Medium",
                  weight: 3,
                  confidence: 0.94,
                  status: "DRAFT",
                  creationStatus: "IDLE",
                },
                {
                  id: "T2",
                  subject: "Log",
                  priority: "High",
                  weight: 0,
                  confidence: 0.42,
                  status: "DRAFT",
                  creationStatus: "IDLE",
                },
              ];
              setDrafts(raw);
              setUiState(UI_STATES.VALIDATING);
            }, 1500);
            break;

          case UI_STATES.VALIDATING:
            timeout = setTimeout(() => {
              setDrafts((prev) =>
                prev.map((d) => ({ ...d, validation: validateTask(d) }))
              );
              setUiState(UI_STATES.REVIEWING);
            }, 1000);
            break;

          default:
            break;
        }
      } catch (e) {
        setUiState(UI_STATES.ERROR);
      }
    };

    handleTransition();
    return () => clearTimeout(timeout);
  }, [uiState, selectedProject, prompt, validateTask]);

  const handleStartPipeline = async () => {
    if (!prompt.trim() || uiState !== UI_STATES.IDLE) return;

    setUiState(UI_STATES.DECOMPOSING);

    try {
      const res = await openPipeline({
        project: selectedProjectId,
        prompt,
        cycle: selectedCycle || null,
      });

      if (res.status === "BLOCKED") {
        setUiState(UI_STATES.BLOCKED);
        return;
      }

      setIntents(res?.message?.intents || []);
      setDrafts(res?.message?.drafts || []);
      setUiState(UI_STATES.REVIEWING);
    } catch (e) {
      console.error(e);
      setUiState(UI_STATES.ERROR);
    }
  };

  const handleUpdateTask = (id, newData) => {
    setDrafts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...newData, status: "DRAFT" } : t))
    );
  };

  const handleApproveTask = (id) => {
    setDrafts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "APPROVED" } : t))
    );
  };

  const handleDeploy = async () => {
    if (
      uiState !== UI_STATES.REVIEWING &&
      uiState !== UI_STATES.PARTIAL_SUCCESS
    ) {
      return;
    }

    const approved = drafts.filter((d) => d.status === "APPROVED");

    if (approved.length === 0) return;

    setUiState(UI_STATES.CREATING);

    try {
      const res = await createTasks({
        project: selectedProjectId,
        tasks: approved.map((t) => ({
          subject: t.subject,
          priority: t.priority,
          weight: t.weight,
        })),
      });

      const results = res.results || [];

      setDrafts((prev) =>
        prev.map((d) => {
          const r = results.find((x) => x.subject === d.subject);
          if (!r) return d;

          return {
            ...d,
            creationStatus: r.status === "SUCCESS" ? "SUCCESS" : "FAILED",
            status: r.status === "SUCCESS" ? "APPROVED" : "DRAFT",
          };
        })
      );

      const hasFailures = results.some((r) => r.status === "FAILED");
      setUiState(hasFailures ? UI_STATES.PARTIAL_SUCCESS : UI_STATES.SUCCESS);
    } catch (e) {
      console.error(e);
      setUiState(UI_STATES.ERROR);
    }
  };

  const handleReset = () => {
    if (uiState === UI_STATES.CREATING) return;

    setUiState(UI_STATES.IDLE);
    setPrompt("");
    setIntents([]);
    setDrafts([]);
  };

  const visuals =
    PIPELINE_VISUALS[uiState] || PIPELINE_VISUALS[UI_STATES.ERROR];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 p-8">
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-4xl p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
              <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
              Task Architect
            </h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">
              Structural Logic Engine
            </p>

            <div className="space-y-6">
              <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={12} /> Target Context
                  </label>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{project}</div>
                </div>

                {selectedProject.mode === "Scrum" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} /> Cycle Boundary
                    </label>

                    <Select
                      disabled={uiState !== UI_STATES.IDLE}
                      className="w-full"
                      value={selectedCycle}
                      onChange={(v) => setSelectedCycle(v)}
                      options={cycles_options_query?.data ?? []}
                    />
                  </div>
                )}

                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                    Scope Policy
                  </div>
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 leading-tight">
                    {selectedProject.scope}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Requirement Prompt
                </label>
                <textarea
                  readOnly={uiState !== UI_STATES.IDLE}
                  className="w-full h-32 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl p-5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all resize-none disabled:opacity-50"
                  placeholder="Enter architectural requirements..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {uiState === UI_STATES.IDLE ? (
                <button
                  onClick={handleStartPipeline}
                  disabled={
                    !prompt ||
                    (selectedProject.mode === "Scrum" && !selectedCycle)
                  }
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 transition-all disabled:opacity-50"
                >
                  <Wand2 size={18} /> Initiate Pipeline
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  disabled={uiState === UI_STATES.CREATING}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-30"
                >
                  {uiState === UI_STATES.CREATING ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                  {uiState === UI_STATES.CREATING
                    ? "Processing Records..."
                    : "Abort & Reset"}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-4xl p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">
              Pipeline State
            </h3>
            <div className="space-y-6">
              {PIPELINE_STEPS.map((step) => {
                const isActive = visuals.active === step.id;
                const isFinished = visuals.finished.includes(step.id);

                return (
                  <div
                    key={step.name}
                    className={`flex gap-4 transition-all ${
                      isActive || isFinished ? "opacity-100" : "opacity-20"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                        isFinished
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : isActive
                          ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 animate-pulse"
                          : "border-slate-100 dark:border-slate-700 text-slate-200 dark:text-slate-700"
                      }`}
                    >
                      {isFinished ? (
                        <Check size={16} />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-current rounded-full" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none mb-1">
                        {step.name}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-tight">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-8">
          {uiState === UI_STATES.IDLE && (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[48px]">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                <Target size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Workbench Idle
              </h3>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-2 italic leading-relaxed">
                Awaiting intent deconstruction sequence. Select context and
                define prompt to begin.
              </p>
            </div>
          )}

          {uiState === UI_STATES.ERROR && (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-rose-50 dark:bg-rose-900/20 border-4 border-dashed border-rose-200 dark:border-rose-800 rounded-[48px] animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-rose-500 dark:text-rose-400 mb-6 border border-rose-100 dark:border-rose-800">
                <ShieldAlert size={40} />
              </div>
              <h3 className="text-xl font-black text-rose-900 dark:text-rose-100 tracking-tight">
                Technical Error Encountered
              </h3>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300 max-w-sm mx-auto mt-2 leading-relaxed uppercase">
                Runtime Exception during structural validation. Data integrity
                maintained.
              </p>
              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={() => setUiState(UI_STATES.VALIDATING)}
                  className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-rose-900/20 flex items-center gap-2"
                >
                  <RefreshCcw size={16} /> Retry Last Step
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Reset Architect
                </button>
              </div>
            </div>
          )}

          {uiState === UI_STATES.BLOCKED && (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-rose-50 dark:bg-rose-900/20 border-4 border-dashed border-rose-200 dark:border-rose-800 rounded-[48px] animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-rose-500 dark:text-rose-400 mb-6 border border-rose-100 dark:border-rose-800">
                <Ban size={40} />
              </div>
              <h3 className="text-xl font-black text-rose-900 dark:text-rose-100 tracking-tight">
                Insufficient Signal
              </h3>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300 max-w-sm mx-auto mt-2 leading-relaxed uppercase">
                Prompt lacks actionable intent for architectural deconstruction.
                Please provide detailed requirements.
              </p>
              <button
                onClick={handleReset}
                className="mt-8 px-8 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
              >
                Modify Intent
              </button>
            </div>
          )}

          {uiState !== UI_STATES.IDLE &&
            uiState !== UI_STATES.BLOCKED &&
            uiState !== UI_STATES.ERROR && (
              <div className="space-y-10 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-4xl p-8 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Layers size={14} /> Step 1: Intents Extracted
                    </h4>
                    <div className="space-y-2">
                      {intents.length > 0 ? (
                        intents.map((i) => (
                          <div
                            key={i.id}
                            className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600 animate-in slide-in-from-left-2"
                          >
                            {i.text}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-slate-300 dark:text-slate-600 italic text-xs flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Parsing...
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`rounded-4xl p-8 border transition-all ${
                      visuals.finished.includes(2)
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Shield size={14} /> Step 2: Policy Guard
                    </h4>
                    {visuals.finished.includes(2) ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck size={32} />
                          <span className="text-lg font-black tracking-tight">
                            Verified
                          </span>
                        </div>
                        <div className="text-[10px] font-black text-emerald-700/60 dark:text-emerald-400/60 uppercase">
                          • Policy: Capacity within bounds for{" "}
                          {selectedProject.name}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-slate-300 dark:text-slate-600 italic text-xs flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />{" "}
                        Validating...
                      </div>
                    )}
                  </div>
                </div>

                {(drafts.length > 0 || uiState === UI_STATES.DRAFTING) && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
                        Task Review Phase
                      </h3>
                      {uiState === UI_STATES.PARTIAL_SUCCESS && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-800 flex items-center gap-2 animate-pulse shadow-sm">
                          <AlertCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-tight">
                            Critical: Correct Failed Records
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {drafts.length > 0 ? (
                        drafts.map((task) => (
                          <TaskReviewCard
                            key={task.id}
                            task={task}
                            disabled={[
                              UI_STATES.CREATING,
                              UI_STATES.SUCCESS,
                            ].includes(uiState)}
                            onUpdate={handleUpdateTask}
                            onReject={(id) =>
                              setDrafts((prev) =>
                                prev.filter((t) => t.id !== id)
                              )
                            }
                            onApprove={handleApproveTask}
                          />
                        ))
                      ) : (
                        <div className="p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[40px] text-slate-300 dark:text-slate-600 space-y-3">
                          <Loader2
                            size={32}
                            className="animate-spin mx-auto mb-2 text-indigo-200 dark:text-indigo-800"
                          />
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            Generating drafts...
                          </p>
                        </div>
                      )}
                    </div>

                    {[
                      UI_STATES.REVIEWING,
                      UI_STATES.CREATING,
                      UI_STATES.SUCCESS,
                      UI_STATES.PARTIAL_SUCCESS,
                    ].includes(uiState) && (
                      <div className="mt-12 p-10 bg-slate-900 dark:bg-slate-950 rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/20 blur-[100px] pointer-events-none" />
                        <div className="relative z-10 space-y-2 text-center md:text-left">
                          <h3 className="text-2xl font-black tracking-tight">
                            Deploy to ERPNext
                          </h3>
                          <p className="text-slate-400 dark:text-slate-500 text-sm font-bold max-w-sm uppercase tracking-tight">
                            High-integrity records will be created in{" "}
                            <span className="text-indigo-400">
                              {selectedProject.name}
                            </span>
                            .
                          </p>
                        </div>
                        <div className="relative z-10">
                          {uiState === UI_STATES.SUCCESS ? (
                            <div className="flex items-center gap-4 bg-emerald-500 px-8 py-4 rounded-3xl shadow-xl shadow-emerald-500/20">
                              <CheckSquare size={24} className="text-white" />
                              <span className="text-xs font-black uppercase tracking-widest">
                                Deployment Successful
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={handleDeploy}
                              disabled={
                                uiState === UI_STATES.CREATING ||
                                drafts.filter(
                                  (t) =>
                                    t.status === "APPROVED" &&
                                    t.creationStatus !== "SUCCESS"
                                ).length === 0
                              }
                              className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/20 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all flex items-center gap-3"
                            >
                              {uiState === UI_STATES.CREATING ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <LinkIcon size={20} />
                              )}
                              {uiState === UI_STATES.CREATING
                                ? "Deploying..."
                                : "Approve & Create Records"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
