import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryParams } from "../../hooks/useQueryParams";
import { Check, Circle, Activity, Edit2 } from "lucide-react";
import { Input, message } from "antd";
import DroppableZone from "./DroppableZone";

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

const PhasesHeader = ({ phases, onPhaseTitleUpdate }) => {
  const qp = useQueryParams();
  const selected_phase_qp = qp.get("custom_phase");
  const scrollContainerRef = useRef(null);
  const selectedPhaseRef = useRef(null);
  const [editingPhase, setEditingPhase] = useState(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    if (selected_phase_qp && selectedPhaseRef.current) {
      selectedPhaseRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selected_phase_qp, phases]);

  useEffect(() => {
    if (editingPhase && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingPhase]);

  const handleTitleSave = useCallback(async (phaseName) => {
    if (!editValue.trim()) {
      setEditingPhase(null);
      return;
    }
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
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          No phases found for this project.
        </p>
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
                key={phase.name || idx}
                id={phase.name}
                data={"phase"}
                isOverColor="bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400 dark:ring-indigo-500"
              >
                <div
                  ref={isSelected ? selectedPhaseRef : null}
                  onClick={() => qp.set("custom_phase", phase.name)}
                  className={`ml-2 shrink-0 w-80 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer transition-all hover:shadow-lg ${isSelected ? "scale-105 shadow-lg ring-2 ring-indigo-500" : "hover:border-slate-200 dark:hover:border-slate-700"} ${config.border}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}
                    >
                      {phase.status === "Active" ? (
                        <Activity size={18} className="animate-pulse" />
                      ) : (
                        <Icon size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingPhase === phase.name ? (
                        <Input
                          ref={editInputRef}
                          size="small"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onPressEnter={() => handleTitleSave(phase.name)}
                          onBlur={() => handleTitleSave(phase.name)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-bold"
                        />
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <h4
                            className={`text-sm font-bold truncate ${selected_phase_qp === phase.name ? (phase.status === "Completed" ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400") : "text-slate-900 dark:text-white"}`}
                          >
                            {phase.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditValue(phase.title);
                              setEditingPhase(phase.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs font-bold rounded ${config.bg} ${config.color}`}
                      >
                        {phase.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span className="font-semibold">Start:</span>{" "}
                      <span>{phase.start_date}</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Progress</span>
                        <span
                          className={`font-bold ${phase.status === "Completed" ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}
                        >
                          {phase.phase_progress || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${phase.status === "Completed" ? "bg-linear-to-r from-emerald-500 to-emerald-600" : "bg-linear-to-r from-indigo-500 to-indigo-600"}`}
                          style={{ width: `${phase.phase_progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </DroppableZone>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PhasesHeader;
