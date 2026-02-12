import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  ShieldCheck,
  Shield,
  Check,
  X,
  Edit3,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  CheckSquare,
  Save,
  UserPlus,
  Briefcase,
  ExternalLink,
  ChevronLeft,
  Activity,
  Zap,
  Cpu,
  ArrowRight,
  Hash,
  Search,
  BrainCircuit,
} from "lucide-react";
import { useFrappePostCall } from "frappe-react-sdk";
import { useQueryParams } from "../hooks/useQueryParams";

// --- Finite State Machine Definitions ---
const UI_STATES = {
  IDLE: "IDLE",
  DECOMPOSING: "DECOMPOSING",
  GUARDING: "GUARDING",
  INTENTS_READY: "INTENTS_READY",
  DRAFTING: "DRAFTING",
  VALIDATING: "VALIDATING",
  REVIEWING: "REVIEWING",
  CREATING: "CREATING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

const PIPELINE_VISUALS = {
  [UI_STATES.IDLE]: { active: null, finished: [] },
  [UI_STATES.DECOMPOSING]: { active: 1, finished: [] },
  [UI_STATES.GUARDING]: { active: 2, finished: [1] },
  [UI_STATES.INTENTS_READY]: { active: null, finished: [1, 2] },
  [UI_STATES.DRAFTING]: { active: 3, finished: [1, 2] },
  [UI_STATES.VALIDATING]: { active: 4, finished: [1, 2, 3] },
  [UI_STATES.REVIEWING]: { active: 5, finished: [1, 2, 3, 4] },
  [UI_STATES.CREATING]: { active: 6, finished: [1, 2, 3, 4, 5] },
  [UI_STATES.SUCCESS]: { active: null, finished: [1, 2, 3, 4, 5, 6] },
  [UI_STATES.ERROR]: { active: null, finished: [], isError: true },
};

const PIPELINE_STEPS = [
  { id: 1, name: "Requirement Extraction", icon: Cpu },
  { id: 2, name: "System Guardrail Check", icon: Shield },
  { id: 3, name: "Task Logic Synthesis", icon: Zap },
  { id: 4, name: "Integrity Validation", icon: ShieldCheck },
  { id: 5, name: "User Review Layer", icon: UserPlus },
  { id: 6, name: "ERPNext Deployment", icon: LinkIcon },
];

const TASK_PRIORITY_COLORS = {
  Urgent: "bg-rose-500 text-white border-rose-600",
  High: "bg-orange-500 text-white border-orange-600",
  Medium: "bg-indigo-500 text-white border-indigo-600",
  Low: "bg-slate-500 text-white border-slate-600",
};

/**
 * Task Review Card Component
 */
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
      className={`group relative bg-white dark:bg-slate-800 border rounded-3xl p-5 transition-all duration-300 ${
        isCreated
          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10"
          : isApproved
            ? "border-indigo-500 ring-1 ring-indigo-500/20 shadow-xl shadow-indigo-100/20"
            : !isValid
              ? "border-rose-200 dark:border-rose-900 bg-rose-50/5"
              : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
      } ${isLocked ? "opacity-90" : ""}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isCreated ? "bg-emerald-500" : isApproved ? "bg-indigo-500" : !isValid ? "bg-rose-500" : "bg-slate-300 animate-pulse"}`}
            />
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Hash size={10} /> {task.name || "UNASSIGNED"}
            </span>
          </div>
          {!isLocked && !isApproved && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onReject(task.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Subject
              </label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                value={localData.subject}
                onChange={(e) =>
                  setLocalData({ ...localData, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Description
              </label>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-20"
                value={localData.description}
                onChange={(e) =>
                  setLocalData({ ...localData, description: e.target.value })
                }
                placeholder="Enter task details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Priority
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-3 py-2 text-xs font-bold"
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
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Weight
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-3 py-2 text-xs font-bold"
                  value={localData.weight}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      weight: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50"
            >
              <Save size={12} /> Save Changes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h4
                className={`text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug ${!isValid && !isApproved ? "line-through text-slate-400" : ""}`}
              >
                {task.subject}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {task.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-slate-50 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${TASK_PRIORITY_COLORS[task.priority] || TASK_PRIORITY_COLORS.Low}`}
                >
                  {task.priority}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {task.weight} Story Pts
                </span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                  <Briefcase size={10} /> {task.project}
                </div>
                <div className="text-[9px] font-black text-indigo-500/50 uppercase">
                  Conf: {(task.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {!isValid && !isApproved && !isCreated && (
          <div className="p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="text-rose-500 shrink-0" />
            <div className="text-[9px] font-bold text-rose-500 uppercase leading-tight truncate">
              {task.validation?.errors?.join(", ")}
            </div>
          </div>
        )}

        {isCreated && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckSquare size={14} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 uppercase">
                  Synced • {task.erpStatus}
                </span>
              </div>
              <ExternalLink
                size={12}
                className="text-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {!isLocked && !isEditing && !isApproved && !isCreated && (
          <div className="pt-2">
            <button
              disabled={!isValid}
              onClick={() => onApprove(task.id)}
              className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isValid ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"}`}
            >
              <Check size={14} /> Approve Intent
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Mock API Responses ---
// const MOCK_INTENTS = [
//   { id: "INT-1", text: "Design responsive To-Do application interface" },
//   { id: "INT-2", text: "Implement user authentication system" },
//   { id: "INT-3", text: "Enable task creation functionality" },
//   { id: "INT-4", text: "Allow task editing and deletion" },
//   { id: "INT-5", text: "Track task status effectively" },
//   { id: "INT-6", text: "Set task priorities and due dates" },
//   { id: "INT-7", text: "Develop task filtering and search options" },
//   { id: "INT-8", text: "Ensure persistent data storage solution" },
//   { id: "INT-9", text: "Integrate basic notification system" },
//   { id: "INT-10", text: "Create scalable maintainable architecture" },
// ];

// const MOCK_DRAFTS = [
//   {
//     id: "0mi9ublb8p",
//     name: "TASK-2026-00041",
//     intentId: "INT-1",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Design responsive To-Do application interface",
//     description:
//       "Create a modern, responsive mobile-first UI using Tailwind CSS and React components.",
//     priority: "High",
//     weight: 5,
//     confidence: 0.9,
//     validation: { valid: true, errors: [] },
//   },
//   {
//     id: "0misvjg3en",
//     name: "TASK-2026-00044",
//     intentId: "INT-2",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Implement user authentication system",
//     description:
//       "Develop secure login, registration, and session management using JWT and encrypted storage.",
//     priority: "High",
//     weight: 5,
//     confidence: 0.85,
//     validation: { valid: true, errors: [] },
//   },
//   {
//     id: "0mivi6pbss",
//     name: "TASK-2026-00045",
//     intentId: "INT-3",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Enable task creation functionality",
//     description:
//       "Build the logic and UI forms to allow users to input and save new tasks to the database.",
//     priority: "High",
//     weight: 0,
//     confidence: 0.9,
//     validation: { valid: false, errors: ["Invalid weight"] },
//   },
//   {
//     id: "0mibktmpef",
//     name: "TASK-2026-00046",
//     intentId: "INT-4",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Allow task editing and deletion",
//     description:
//       "Implement CRUD operations for existing tasks with optimistic UI updates.",
//     priority: "Medium",
//     weight: 0,
//     confidence: 0.8,
//     validation: { valid: false, errors: ["Invalid weight"] },
//   },
//   {
//     id: "0miju9dnaq",
//     name: "TASK-2026-00047",
//     intentId: "INT-5",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Track task status effectively",
//     description:
//       "Create status transitions (Todo, Doing, Done) and progress visualization bars.",
//     priority: "Medium",
//     weight: 3,
//     confidence: 0.75,
//     validation: { valid: true, errors: [] },
//   },
//   {
//     id: "0mi1veumun",
//     name: "TASK-2026-00048",
//     intentId: "INT-6",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Set task priorities and due dates",
//     description:
//       "Add date pickers and priority labels to task metadata for better scheduling.",
//     priority: "Medium",
//     weight: 3,
//     confidence: 0.8,
//     validation: { valid: true, errors: [] },
//   },
//   {
//     id: "0mi5a4e14j",
//     name: "TASK-2026-00049",
//     intentId: "INT-7",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Develop task filtering and search options",
//     description:
//       "Build a robust filtering system for tags, priorities, and keyword search.",
//     priority: "Medium",
//     weight: 3,
//     confidence: 0.7,
//     validation: { valid: true, errors: [] },
//   },
//   {
//     id: "0mi282pqun",
//     name: "TASK-2026-00050",
//     intentId: "INT-8",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Ensure persistent data storage solution",
//     description:
//       "Integrate Firestore or local indexedDB for data persistence across sessions.",
//     priority: "High",
//     weight: 5,
//     confidence: 0.95,
//     validation: { valid: true, errors: [] },
//   },
//   {
//     id: "0mii66a22o",
//     name: "TASK-2026-00051",
//     intentId: "INT-9",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Integrate basic notification system",
//     description:
//       "Setup push notifications or browser alerts for task deadlines.",
//     priority: "Low",
//     weight: 2,
//     confidence: 0.6,
//     validation: { valid: true, errors: [] },
//   },
//   {
//     id: "0mimdintv0",
//     name: "TASK-2026-00052",
//     intentId: "INT-10",
//     erpStatus: "Open",
//     type: "Task",
//     cycle: null,
//     modified: "2026-02-10 16:47:45.459",
//     project: "PROJ-0002",
//     subject: "Create scalable maintainable architecture",
//     description:
//       "Ensure modular code structure with clear separation of concerns using MVC or Clean Architecture.",
//     priority: "High",
//     weight: 5,
//     confidence: 0.9,
//     validation: { valid: true, errors: [] },
//   },
// ];

export default function App() {
  const request_intent_query = useFrappePostCall(
    "infintrix_atlas.api.ai_pipeline.request_intent_decomposition",
  );

  const request_task_drafting_query = useFrappePostCall(
    "infintrix_atlas.api.ai_pipeline.request_task_drafting",
  );

  const create_tasks = useFrappePostCall(
    "infintrix_atlas.api.ai.create_from_ai",
  );
  const [uiState, setUiState] = useState(UI_STATES.IDLE);
  const [prompt, setPrompt] = useState(
    "Design and develop a responsive To-Do application with user authentication, task management, and persistent storage.",
  );
  const [intents, setIntents] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [session, setSession] = useState("null-session");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const qp = useQueryParams();
  const project = qp.get("project") || null;
  // const request_intent_query =
const handleExtractIntents = async () => {
  setUiState(UI_STATES.DECOMPOSING);
  try {
    const res = await request_intent_query.call({ prompt, project });
    const data = res.message || [];

    // if (!data.length) throw new Error("No intents extracted from API");

    setIntents(data);
    setUiState(UI_STATES.INTENTS_READY);
  } catch (err) {
    console.error("Intent Extraction Error:", err);
    alert(err.message || "Failed to extract intents");
    setUiState(UI_STATES.ERROR);
  }
};


  // const handleExtractIntents = useCallback(async () => {
  //   setUiState(UI_STATES.DECOMPOSING);
  //   request_intent_query
  //     .call({ prompt })
  //     .then((res) => {
  //       const data = res.message || [];
  //       console.log("API Response:", res.message);
  //       setUiState(UI_STATES.GUARDING);
  //       setIntents(data);
  //       setSession("sess_" + Math.random().toString(36).slice(2, 8));
  //       setUiState(UI_STATES.INTENTS_READY);
  //     })
  //     .catch((err) => {
  //       console.error("API Error:", err);
  //       setUiState(UI_STATES.ERROR);
  //     });
  // }, []);

  const handleDraftTasks = useCallback(async () => {
    if (!intents.length) {
      console.error("Draft requested with empty intents");
      return;
    }

    setUiState(UI_STATES.DRAFTING);

    const res = await request_task_drafting_query.call({
      intents,
      project,
    });

    setUiState(UI_STATES.VALIDATING);
    setDrafts(res?.message || []);
    setUiState(UI_STATES.REVIEWING);
  }, [intents, project]);

  const handleUpdateTask = (id, newData) => {
    setDrafts((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedTask = { ...t, ...newData };
          const isValid =
            updatedTask.weight > 0 && updatedTask.subject?.trim().length > 0;
          return {
            ...updatedTask,
            validation: {
              valid: isValid,
              errors: isValid ? [] : ["Invalid weight or subject"],
            },
          };
        }
        return t;
      }),
    );
  };

  const handleApproveTask = (id) =>
    setDrafts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "APPROVED" } : t)),
    );
  const handleBulkApprove = () =>
    setDrafts((prev) =>
      prev.map((t) => (t.validation.valid ? { ...t, status: "APPROVED" } : t)),
    );

  const handleDeploy = () => {
    setUiState(UI_STATES.CREATING);
    create_tasks
      .call({
        tasks: drafts
          .filter((d) => d.status === "APPROVED")
          .map((d) => ({
            subject: d.subject,
            description: d.description,
            priority: d.priority,
            weight: d.weight,
            project,
          })),
        project,
      })
      .then((res) => {
        console.log("Create Tasks Response:", res);

        setDrafts((prev) =>
          prev.map((d) =>
            d.status === "APPROVED"
              ? {
                  ...d,
                  creationStatus: "SUCCESS",
                  modified: new Date()
                    .toISOString()
                    .replace("T", " ")
                    .split(".")[0],
                  erpStatus: "Open",
                }
              : d,
          ),
        );
        setUiState(UI_STATES.SUCCESS);
      });

  };

  const handleReset = () => {
    setUiState(UI_STATES.IDLE);
    setIntents([]);
    setDrafts([]);
  };

  const filteredTasks = useMemo(() => {
    return drafts.filter((t) => {
      const matchesSearch =
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      if (filter === "errors") return matchesSearch && !t.validation.valid;
      if (filter === "approved")
        return matchesSearch && t.status === "APPROVED";
      if (filter === "pending")
        return matchesSearch && t.status === "DRAFT" && t.validation.valid;
      return matchesSearch;
    });
  }, [drafts, filter, search]);

  // const stats = useMemo(
  //   () => ({
  //     total: drafts.length,
  //     approved: drafts.filter(
  //       (d) => d.status === "APPROVED" || d.creationStatus === "SUCCESS",
  //     ).length,
  //     invalid: drafts.filter((d) => !d.validation.valid).length,
  //     effort: drafts.reduce((acc, curr) => acc + curr.weight, 0),
  //     avgConfidence: (
  //       (drafts.reduce((acc, curr) => acc + curr.confidence, 0) /
  //         (drafts.length || 1)) *
  //       100
  //     ).toFixed(0),
  //   }),
  //   [drafts],
  // );
  const stats = {};
  const currentPhase = useMemo(() => {
    if (
      [
        UI_STATES.IDLE,
        UI_STATES.DECOMPOSING,
        UI_STATES.GUARDING,
        UI_STATES.INTENTS_READY,
      ].includes(uiState)
    )
      return 1;
    return 2;
  }, [uiState]);

  const visuals =
    PIPELINE_VISUALS[uiState] || PIPELINE_VISUALS[UI_STATES.ERROR];
  const isIntentPhase = [UI_STATES.DECOMPOSING, UI_STATES.GUARDING].includes(
    uiState,
  );
  const isTaskPhase = [UI_STATES.DRAFTING, UI_STATES.VALIDATING].includes(
    uiState,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 p-4 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* IDLE STATE */}
        {uiState === UI_STATES.IDLE && (
          <div className="mt-12 lg:mt-24 max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-full">
                <Activity size={12} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  Architect Engine v4.6 Stage-Stepped
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter leading-none">
                Turn Ideas into <span className="text-indigo-600">Logic.</span>
              </h1>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-10 shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-3 mb-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Requirement Prompt
                </label>
                <textarea
                  className="w-full h-44 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-100 dark:border-slate-700 rounded-[24px] p-6 text-base font-medium focus:ring-4 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Describe your technical vision..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <button
                onClick={handleExtractIntents}
                className="group w-full py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.01] transition-all shadow-2xl"
              >
                <BrainCircuit
                  size={20}
                  className="group-hover:rotate-12 transition-transform"
                />
                Start Synthesis (Step 1)
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING STATES */}
        {(isIntentPhase || isTaskPhase) && (
          <div className="mt-32 max-w-md mx-auto text-center space-y-16 animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] animate-pulse rounded-full" />
              <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl flex items-center justify-center relative z-10 border border-slate-100 dark:border-slate-700">
                <Loader2
                  size={56}
                  className="text-indigo-600 animate-spin"
                  strokeWidth={3}
                />
              </div>
            </div>
            <div className="space-y-8 relative z-10">
              <h3 className="text-3xl font-black tracking-tight">
                {isIntentPhase
                  ? "Step 1: Extracting Intents..."
                  : "Step 2: Synthesizing Logic..."}
              </h3>
              <div className="flex justify-center gap-2">
                {PIPELINE_STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`h-2 rounded-full transition-all duration-700 ${visuals.finished.includes(step.id) ? "w-10 bg-emerald-500" : visuals.active === step.id ? "w-16 bg-indigo-600" : "w-4 bg-slate-200 dark:bg-slate-700"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {(uiState === UI_STATES.INTENTS_READY ||
          uiState === UI_STATES.REVIEWING ||
          uiState === UI_STATES.SUCCESS ||
          uiState === UI_STATES.CREATING) && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Step Indicator */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-8 ml-4">
                <div
                  className={`flex items-center gap-3 transition-opacity ${currentPhase === 1 ? "opacity-100" : "opacity-40"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border-2 transition-colors ${currentPhase === 1 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-emerald-500 border-emerald-500 text-white"}`}
                  >
                    {currentPhase > 1 ? <Check size={20} /> : "1"}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">
                      Phase One
                    </div>
                    <div className="text-xs font-black">
                      Intent Deconstruction
                    </div>
                  </div>
                </div>

                <ArrowRight size={20} className="text-slate-200" />

                <div
                  className={`flex items-center gap-3 transition-opacity ${currentPhase === 2 ? "opacity-100" : "opacity-40"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border-2 transition-colors ${currentPhase === 2 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300"}`}
                  >
                    2
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">
                      Phase Two
                    </div>
                    <div className="text-xs font-black">Logic Synthesis</div>
                  </div>
                </div>
              </div>

              <div className="mr-4 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2">
                  Status:
                </span>
                <span className="text-[10px] font-black uppercase text-indigo-600">
                  {uiState.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Sidebar */}
              <aside className="lg:col-span-3 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-base font-black leading-none">
                        Architect
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                        ID: {session.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {uiState === UI_STATES.INTENTS_READY ? (
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
                        <div className="text-[10px] font-black text-indigo-600 uppercase mb-2">
                          Step 1 Ready
                        </div>
                        <div className="text-xs font-bold leading-tight text-slate-600 dark:text-indigo-200">
                          Verify extracted intents before initiating step 2
                          deconstruction.
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase mb-1">
                            Items
                          </div>
                          <div className="text-xl font-black">
                            {stats.total}
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase mb-1">
                            Conf.
                          </div>
                          <div className="text-xl font-black text-indigo-600">
                            {stats.avgConfidence}%
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleReset}
                      className="w-full flex items-center justify-center gap-2 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all"
                    >
                      <ChevronLeft size={16} /> New Deconstruction
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-7 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                    Execution Log
                  </h3>
                  <div className="space-y-4">
                    {PIPELINE_STEPS.map((step) => {
                      const StepIcon = step.icon;
                      const isDone = visuals.finished.includes(step.id);
                      return (
                        <div key={step.id} className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300"}`}
                          >
                            <StepIcon size={14} />
                          </div>
                          <span
                            className={`text-[11px] font-bold ${isDone ? "text-slate-900 dark:text-slate-100" : "text-slate-300"}`}
                          >
                            {step.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="lg:col-span-9 space-y-8">
                {/* Intent View (Step 1) */}

                {currentPhase === 1 && (
                  <div
                    className={`grid grid-cols-1 gap-8 ${uiState === UI_STATES.INTENTS_READY ? "md:grid-cols-1" : ""}`}
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Zap size={14} className="text-indigo-600" /> Step 1:
                          Extraction Results
                        </h4>
                        {uiState === UI_STATES.INTENTS_READY && (
                          <button
                            onClick={handleDraftTasks}
                            disabled={
                              !intents.length ||
                              uiState !== UI_STATES.INTENTS_READY
                            }
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02]"
                          >
                            Synthesize Step 2 <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                      <div
                        className={`grid gap-2.5 ${uiState === UI_STATES.INTENTS_READY ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
                      >
                        {intents.map((i, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex gap-3">
                              <span className="text-indigo-400 font-black">
                                {i.id}
                              </span>
                              {i.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>


                    {intents.length === 0 && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-10 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-sm font-bold text-slate-400">
                        No intents extracted. Please revise your prompt and try
                        again.
                      </div>
                    )}

                    {/* Dashboard Stats (Step 2 Only) */}
                    {uiState !== UI_STATES.INTENTS_READY && (
                      <div className="space-y-6">
                        <div className="bg-emerald-600 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                          <div className="absolute bottom-0 right-0 -mb-10 -mr-10 opacity-10">
                            <ShieldCheck size={200} />
                          </div>
                          <div className="relative z-10 space-y-4">
                            <h3 className="text-3xl font-black leading-tight">
                              Step 2 Verified
                            </h3>
                            <p className="text-white/70 text-xs font-medium leading-relaxed">
                              Synthesis of architectural logic complete for{" "}
                              <span className="text-white font-bold">
                                PROJ-0002
                              </span>
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Task Backlog (Step 2 Only) */}
                {(uiState === UI_STATES.REVIEWING ||
                  uiState === UI_STATES.SUCCESS ||
                  uiState === UI_STATES.CREATING) && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                          <Search
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            placeholder="Search subjects..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleBulkApprove}
                        className="w-full md:w-auto px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                      >
                        <CheckSquare size={14} /> Bulk Approve Valid
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredTasks.map((task) => (
                        <TaskReviewCard
                          key={task.id}
                          task={task}
                          disabled={
                            uiState === UI_STATES.CREATING ||
                            uiState === UI_STATES.SUCCESS
                          }
                          onUpdate={handleUpdateTask}
                          onReject={(id) =>
                            setDrafts((prev) => prev.filter((t) => t.id !== id))
                          }
                          onApprove={handleApproveTask}
                        />
                      ))}
                    </div>

                    {/* Sync Bar */}
                    <div className="mt-16 relative bg-slate-900 dark:bg-slate-800 p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl overflow-hidden">
                      <div className="relative z-10 space-y-2 text-center md:text-left">
                        <h3 className="text-2xl font-black tracking-tight">
                          Step 2: Sync to ERP
                        </h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                          {stats.approved} items approved • Push to Backlog
                        </p>
                      </div>

                      <div className="relative z-10 w-full md:w-auto">
                        {uiState === UI_STATES.SUCCESS ? (
                          <div className="bg-emerald-500 px-10 py-5 rounded-[24px] flex items-center gap-4 shadow-xl">
                            <CheckSquare size={24} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                              Sync Success
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={handleDeploy}
                            disabled={
                              uiState === UI_STATES.CREATING ||
                              stats.approved === 0
                            }
                            className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95"
                          >
                            {uiState === UI_STATES.CREATING ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : (
                              <ArrowRight size={20} />
                            )}
                            {uiState === UI_STATES.CREATING
                              ? "Syncing..."
                              : "Push to ERPNext"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
