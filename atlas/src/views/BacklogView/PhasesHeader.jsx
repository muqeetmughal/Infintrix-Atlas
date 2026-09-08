import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryParams } from "../../hooks/useQueryParams";
import { Check, Circle, Activity, Edit2, Settings, Sparkles } from "lucide-react";
import DroppableZone from "./DroppableZone";
import { DatePicker, Input, InputNumber, Modal, Select, message } from "antd";
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import dayjs from "dayjs";
import usePhaseArchitect from "../../store/usePhaseArchitect";


const STATUS_CONFIG = {
  Completed: {
    icon: Check,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    border: "border-emerald-200 dark:border-emerald-800",
    stroke: "#10b981",
    trail: "#d1fae5",
  },
  Active: {
    icon: Activity,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950",
    border: "border-indigo-500 dark:border-indigo-700",
    stroke: "#6366f1",
    trail: "#e0e7ff",
  },
  Planned: {
    icon: Circle,
    color: "text-slate-300 dark:text-slate-600",
    bg: "bg-white dark:bg-slate-900",
    border: "border-slate-100 dark:border-slate-800",
    stroke: "#94a3b8",
    trail: "#e2e8f0",
  },
};

const CircularProgress = ({ percent, strokeColor, trailColor, size = 40 }) => {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trailColor} strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={strokeColor} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-black tabular-nums text-slate-700 dark:text-slate-300">
        {percent}%
      </span>
    </div>
  );
};

const EditPhaseModal = ({ open, phase, onClose, onSaved }) => {
  const [title, setTitle] = useState("");
  const [sequence, setSequence] = useState(null);
  const [status, setStatus] = useState("Planned");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [completionPct, setCompletionPct] = useState(null);
  const [saving, setSaving] = useState(false);
  const updateDoc = useFrappeUpdateDoc();

  useEffect(() => {
    if (phase) {
      setTitle(phase.title || "");
      setSequence(phase.sequence || null);
      setStatus(phase.status || "Planned");
      setStartDate(phase.start_date ? dayjs(phase.start_date) : null);
      setEndDate(phase.end_date ? dayjs(phase.end_date) : null);
      setCompletionPct(phase.completion_percentage ?? null);
    }
  }, [phase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc.updateDoc("Project Phase", phase.name, {
        title,
        status,
        start_date: startDate ? startDate.format("YYYY-MM-DD") : null,
        end_date: endDate ? endDate.format("YYYY-MM-DD") : null,
      });
      message.success("Phase updated");
      onSaved?.();
      onClose();
    } catch {
      message.error("Failed to update phase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Edit Phase: ${phase?.title || ""}`}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="Save"
      destroyOnClose
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Sequence</label>
            <InputNumber value={sequence} disabled className="w-full" min={0} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Status</label>
            <Select
              value={status}
              onChange={setStatus}
              className="w-full"
              options={[
                { value: "Planned", label: "Planned" },
                { value: "Active", label: "Active" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Start Date</label>
            <DatePicker value={startDate} onChange={setStartDate} className="w-full" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">End Date</label>
            <DatePicker value={endDate} onChange={setEndDate} className="w-full" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Completion %</label>
          <InputNumber value={completionPct} disabled className="w-full" min={0} max={100} />
        </div>
      </div>
    </Modal>
  );
};

const PhasesHeader = ({ phases, onPhaseTitleUpdate, onStatusChange }) => {
  const openPhaseArchitect = usePhaseArchitect((s) => s.open);
  const qp = useQueryParams();
  const selected_phase_qp = qp.get("custom_phase");
  const scrollContainerRef = useRef(null);
  const selectedPhaseRef = useRef(null);
  const [editingPhase, setEditingPhase] = useState(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef(null);
  const [editPhase, setEditPhase] = useState(null);
  const closeEditPhase = useCallback(() => setEditPhase(null), []);

  useEffect(() => {
    if (selected_phase_qp && selectedPhaseRef.current) {
      selectedPhaseRef.current.scrollIntoView({
        behavior: "smooth", block: "nearest", inline: "center",
      });
    }
  }, [selected_phase_qp, phases]);

  useEffect(() => {
    if (editingPhase && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingPhase]);

  const handleTitleSave = useCallback(async (phaseName) => {
    if (!editValue.trim()) { setEditingPhase(null); return; }
    try {
      await onPhaseTitleUpdate(phaseName, editValue.trim());
      setEditingPhase(null);
    } catch {
      message.error("Failed to update phase title");
    }
  }, [editValue, onPhaseTitleUpdate]);

  if (!phases.length) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-white/60 dark:bg-slate-900/40">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No phases found for this project.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mx-5">
      <div className="overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
        <div className="flex gap-3 p-2 min-w-min pb-2">
          {phases.map((phase, idx) => {
            const config = STATUS_CONFIG[phase.status] || STATUS_CONFIG.Planned;
            const Icon = config.icon;
            const isSelected = selected_phase_qp === phase.name;

            return (
              <DroppableZone
                key={phase.name || idx} id={phase.name} data={"phase"}
                isOverColor="bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400 dark:ring-indigo-500"
              >
                <div
                  ref={isSelected ? selectedPhaseRef : null}
                  onClick={() => qp.set("custom_phase", phase.name)}
                  className={`flex-1 min-w-[220px] p-3 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer transition-all hover:shadow-md ${isSelected ? "scale-105 shadow-lg ring-2 ring-indigo-500" : "hover:border-slate-200 dark:hover:border-slate-700"} ${config.border}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                      {phase.status === "Active" ? <Activity size={14} className="animate-pulse" /> : <Icon size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingPhase === phase.name ? (
                        <Input
                          ref={editInputRef} size="small" value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onPressEnter={() => handleTitleSave(phase.name)}
                          onBlur={() => handleTitleSave(phase.name)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold"
                        />
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <span className={`text-xs font-bold truncate ${isSelected ? (phase.status === "Completed" ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400") : "text-slate-900 dark:text-white"}`}>
                            {phase.title}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditValue(phase.title); setEditingPhase(phase.name); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditPhase(phase); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded text-slate-400 hover:text-indigo-600 ml-auto"
                            title="Edit phase details"
                          >
                            <Settings size={10} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openPhaseArchitect(phase); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded text-slate-400 hover:text-indigo-600"
                            title="AI Architect for this phase"
                          >
                            <Sparkles size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <Select
                      value={phase.status || "Planned"} variant="borderless" size="small"
                      popupMatchSelectWidth={false} className="phase-status-select flex-1" style={{ width: 100 }}
                      options={[
                        { value: "Planned", label: "Planned" },
                        { value: "Active", label: "Active" },
                        { value: "Completed", label: "Completed" },
                      ]}
                      onChange={(value) => onStatusChange(phase.name, value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1" />
                    <CircularProgress
                      percent={phase.phase_progress || 0}
                      strokeColor={phase.status === "Active" ? "#6366f1" : config.stroke}
                      trailColor={phase.status === "Active" ? "#e0e7ff" : config.trail}
                      size={40}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                    <span>{phase.start_date ? new Date(phase.start_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—"}</span>
                    <span>{phase.end_date ? new Date(phase.end_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—"}</span>
                  </div>
                </div>
              </DroppableZone>
            );
          })}
        </div>
      </div>
      <EditPhaseModal
        open={!!editPhase}
        phase={editPhase}
        onClose={closeEditPhase}
        onSaved={() => {}}
      />
    </div>
  );
};

export default PhasesHeader;
