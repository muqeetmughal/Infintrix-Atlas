import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  Plus,
  ChevronRight,
  Package,
  Trash,
  ArrowUpRight,
  TrendingUp,
  Edit2
} from "lucide-react";
import {
  useFrappeCreateDoc,
  useFrappeDeleteDoc,
  useFrappeGetCall,
  useFrappePostCall,
  useFrappeUpdateDoc,
  useSWRConfig,
} from "frappe-react-sdk";
import { Button, Input, message, Modal, Select, Space, Spin, Tooltip } from "antd";
import { useQueryParams } from "../../hooks/useQueryParams";
import { useProjectDetailsQuery } from "../../hooks/query";
import PhasesHeader from "./PhasesHeader";
import PhaseCopilot from "./PhaseCopilot";
import usePhaseArchitect from "../../store/usePhaseArchitect";
import useBacklogStore from "../../store/useBacklogStore";
import DroppableZone from "./DroppableZone";
import Badge from "./Badge";
import TaskCard from "./TaskCard";
import InlineTaskCreator from "./InlineTaskCreator";
import Cycle from "./Cycle";

const TASK_STATUS_COLORS = {
  Backlog: "bg-slate-100 text-slate-600",
  Todo: "bg-blue-50 text-blue-600",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Done: "bg-emerald-100 text-emerald-700",
};

// --- Components ---

// --- Main App ---

const BacklogView = () => {
  // const [tasks, setTasks] = useState(initialTasks);
  const qp = useQueryParams();
  const custom_phase = qp.get("custom_phase") || null;
  // const [selectedPhase, setSelectedPhase] = useState(null);
  const phaseInputRef = useRef(null);
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [phaseTitle, setPhaseTitle] = useState("");

  const { mutate } = useSWRConfig();
  const project_id = qp.get("project") || null;
  const statusFilter = qp.getArray("status");
  const priorityFilter = qp.getArray("priority");
  const searchText = (qp.get("search") || "").toLowerCase();
  const updateMutation = useFrappeUpdateDoc();
  const set_backlog_position = useFrappePostCall(
    "infintrix_atlas.api.v1.set_backlog_position",
  );
  const createMutation = useFrappeCreateDoc();
  const deleteMutation = useFrappeDeleteDoc();
  const complete_cycle_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.complete_cycle",
  );
  const bulkDeleteTasks = useFrappePostCall(
    "infintrix_atlas.api.v1.bulk_delete_tasks",
  );
  const [activeId, setActiveId] = useState(null);
  const phaseArchitectPhase = usePhaseArchitect((s) => s.phase);
  const openPhaseArchitect = usePhaseArchitect((s) => s.open);
  const closePhaseArchitect = usePhaseArchitect((s) => s.close);

  const selectedTasks = useBacklogStore((s) => s.selectedTasks);
  const isBacklogExpanded = useBacklogStore((s) => s.isBacklogExpanded);
  const showBacklogCreator = useBacklogStore((s) => s.showBacklogCreator);
  const clearTaskSelection = useBacklogStore((s) => s.clearTaskSelection);
  const toggleBacklogExpanded = useBacklogStore((s) => s.toggleBacklogExpanded);
  const setShowBacklogCreator = useBacklogStore((s) => s.setShowBacklogCreator);
  const project_query = useProjectDetailsQuery(project_id);

  const cycles_query3 = useFrappeGetCall(
    "infintrix_atlas.api.v1.backlog_with_phases",
    {
      project: project_id,
    },
    project_id ? ["backlog_with_phases", project_id] : null,
  );

  const project = project_query.data || {};
  const hasActiveCycle = useMemo(() => {
    return cycles_query3.data?.message?.active_cycle_name ? true : false;
  }, [cycles_query3.data]);

  const active_cycle_name = useMemo(
    () => cycles_query3.data?.message?.active_cycle_name || null,
    [cycles_query3.data],
  );
  const isScrum = useMemo(() => {
    return cycles_query3.data?.message?.is_scrum || false;
  }, [cycles_query3.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  // const backlogTasks = useMemo(() => {
  //   return cycles_query3?.data?.message?.backlog || [];
  // }, [cycles_query3.data]);
  const phases = useMemo(() => {
    return cycles_query3?.data?.message?.phases || [];
  }, [cycles_query3.data]);
  const prevCustomPhase = useRef(custom_phase);

  useEffect(() => {
    if (custom_phase && custom_phase !== prevCustomPhase.current && phases.length) {
      const phase = phases.find(p => p.name === custom_phase);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (phase) openPhaseArchitect(phase);
    }
    prevCustomPhase.current = custom_phase;
  }, [custom_phase, phases]);

  const defaultPhase = useMemo(() => {
    const active = cycles_query3?.data?.message?.active_phase || null;
    if (active) return active
    return phases.length > 0 ? phases[phases.length - 1] : null
  }, [cycles_query3.data, phases]);

  const all_tasks = useMemo(() => {
    return cycles_query3?.data?.message?.all_tasks || [];
  }, [cycles_query3.data]);
  const cycles = useMemo(() => {
    return cycles_query3?.data?.message?.cycles_by_phase[custom_phase] || [];
  }, [cycles_query3.data, custom_phase, defaultPhase]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    if (!selectedTasks.has(event.active.id)) {
      clearTaskSelection();
    }
  };

  const backlogTasks = useMemo(() => {
    return cycles_query3?.data?.message?.backlog_by_phase[custom_phase] || [];
  }, [cycles_query3.data, custom_phase]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const type = over?.data?.current || null;

    if (over) {
      const taskIds = selectedTasks.has(active.id)
        ? Array.from(selectedTasks)
        : [active.id];
      handleMoveTask(taskIds, over.id, type);
    }
    setActiveId(null);
    clearTaskSelection();
  };

  const handleMoveTask = useCallback(
    (taskIds, targetId, type) => {
      const isMulti = taskIds.length > 1;

      if (type === "cycle" && targetId === active_cycle_name) {
        message.error(
          "Cannot move task to active cycle. Please complete the active cycle before moving tasks into it.",
        );
        return;
      }

      if (type === "phase" && targetId !== "Open") {
        const targetPhase = phases.find((p) => p.name === targetId);
        if (targetPhase?.status === "Completed") {
          message.error("Cannot move task to a completed phase.");
          return;
        }
      }

      set_backlog_position
        .call({
          type: type,
          task_name: taskIds[0],
          task_names: isMulti ? JSON.stringify(taskIds) : undefined,
          target_id: targetId === "Open" ? null : targetId,
        })
        .then((response) => {
          if (response?.message?.success) {
            message.success(response?.message?.message);
            cycles_query3.mutate();
            project_query.mutate();
          } else {
            message.error(response?.message?.message);
          }
        });
    },
    [
      updateMutation,
      cycles_query3,
      project_query,
      isScrum,
      hasActiveCycle,
      active_cycle_name,
    ],
  );

  const addCycle = () => {
    const nextId = cycles.length + 1;
    const newCycle = {
      name: `CYC-0${nextId}`,
      title: `Sprint ${11 + nextId}: New Milestone`,
      status: "Planned",
      start_date: "TBD",
      end_date: "TBD",
    };
    setCycles([...cycles, newCycle]);
  };

  const activeTask = useMemo(
    () => all_tasks.find((t) => t.id === activeId),
    [all_tasks, activeId],
  );
  const activeSelection = useMemo(
    () => all_tasks.filter((t) => selectedTasks.has(t.id)),
    [all_tasks, selectedTasks],
  );
  const selectedPhase = useMemo(() => {
    return phases.find((p) => p.name === custom_phase) || defaultPhase;
  }, [phases, custom_phase, defaultPhase]);

  const selectedTaskRecords = useMemo(
    () => all_tasks.filter((task) => selectedTasks.has(task.id)),
    [all_tasks, selectedTasks],
  );




useEffect(() => {
  if (isEditingPhase) {
    phaseInputRef.current?.focus();
  }
}, [isEditingPhase]);

const handlePhaseUpdate = async () => {
  if (!phaseTitle.trim() || phaseTitle === selectedPhase?.title) {
    setIsEditingPhase(false);
    return;
  }
  try {
    await updateMutation.updateDoc("Project Phase", selectedPhase.name, {
      title: phaseTitle,
    });
    await cycles_query3.mutate();
    setIsEditingPhase(false);
  } catch (error) {
    message.error("Failed to update phase title");
  }
};

  const handleBulkDelete = useCallback(() => {
    const taskIds = Array.from(selectedTasks);
    if (!taskIds.length) return;

    Modal.confirm({
      title: `Delete ${taskIds.length} selected task(s)?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await bulkDeleteTasks.call({
            task_names: JSON.stringify(taskIds),
          });
          const result = response?.message || {};

          if (result.success) {
            if (result.failed?.length) {
              message.warning(result.message || "Some tasks could not be deleted");
            } else {
              message.success(result.message || "Tasks deleted successfully");
            }
            clearTaskSelection();
            await Promise.all([cycles_query3.mutate(), project_query.mutate()]);
          } else {
            message.error(result.message || "Failed to delete tasks");
          }
        } catch (error) {
          message.error(error?.message || "Failed to delete tasks");
        }
      },
    });
  }, [selectedTasks, bulkDeleteTasks, cycles_query3, project_query]);




  if (cycles_query3.isLoading) return <div>Loading...</div>;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <PhasesHeader
          phases={phases}
          onPhaseTitleUpdate={async (phaseName, newTitle) => {
            await updateMutation.updateDoc("Project Phase", phaseName, { title: newTitle })
            await cycles_query3.mutate()
          }}
          onStatusChange={async (phaseName, status) => {
            await updateMutation.updateDoc("Project Phase", phaseName, { status })
            await cycles_query3.mutate()
          }}
        />

        {phases.length !== 0 && selectedPhase && (
          <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 h-full">
            {/* Left Panel - AI Architect */}
            {phaseArchitectPhase && (
              <div className="w-full lg:w-[480px] xl:w-[560px] shrink-0">
                <div className="phase-ai-architect">
                  <PhaseCopilot
                    phase={phaseArchitectPhase}
                    project={project_id}
                    onClose={closePhaseArchitect}
                  />
                </div>
              </div>
            )}
      
            {/* Right Panel - Tasks */}
            <div className="flex-1 min-w-0">
              {selectedTasks.size > 0 && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-red-800">
                      {selectedTasks.size} task{selectedTasks.size === 1 ? "" : "s"} selected
                    </p>
                    <p className="text-xs text-red-600 truncate">
                      {selectedTaskRecords.slice(0, 3).map((task) => task.subject).join(", ")}
                      {selectedTaskRecords.length > 3 ? ` +${selectedTaskRecords.length - 3} more` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      onClick={() => clearTaskSelection()}
                    >
                      Clear
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<Trash size={14} />}
                      loading={bulkDeleteTasks.loading}
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-200px)]">
                {/* Cycles */}
                {isScrum && (
                  <div className="space-y-3">
                    {cycles.map((cycle) => (
                      <Cycle key={cycle.name} cycle={cycle} deleteMutation={deleteMutation} cycles_query3={cycles_query3} />
                    ))}
                  </div>
                )}

                {/* Backlog */}
                <DroppableZone
                  id="Open"
                  data={"backlog"}
                  isOverColor="bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400 dark:ring-indigo-500"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-600 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <ChevronRight
                        onClick={toggleBacklogExpanded}
                        size={18}
                        className={`text-slate-400 dark:text-slate-500 transition-transform cursor-pointer ${
                          isBacklogExpanded ? "rotate-90" : ""
                        }`}
                      />
                      <div className="p-2 rounded-lg bg-indigo-600 dark:bg-indigo-700 text-white">
                        <Package size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                          Backlog
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {backlogTasks.length} Work Items
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800">
                      Backlog
                    </Badge>
                  </div>

                  {isBacklogExpanded && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      {showBacklogCreator ? (
                        <InlineTaskCreator
                          project_id={project_id}
                          phase_id={custom_phase}
                          onCreated={() => cycles_query3.mutate()}
                        />
                      ) : (
                        <button
                          onClick={() => setShowBacklogCreator(true)}
                          className="w-full border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-lg p-3 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all"
                        >
                          <Plus size={14} />
                          <span className="text-[9px] font-bold uppercase">
                            Add Task
                          </span>
                        </button>
                      )}

                      {backlogTasks.map((t) => (
                        <TaskCard key={t.id} task={t} />
                      ))}
                    </div>
                  )}
                </DroppableZone>
              </div>

              <DragOverlay>
                {activeTask ? (
                  <div className="relative">
                    <TaskCard task={activeTask} isOverlay />
                    {selectedTasks.size > 1 && (
                      <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {selectedTasks.size}
                      </div>
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          </div>
        )}
      </DndContext>
    </>
  );
};
export default BacklogView;
