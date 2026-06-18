import React, {
  useState,
  useMemo,
  useCallback,
  use,
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
import { useParams } from "react-router-dom";
import { Button, Input, message, Select, Space, Spin, Tooltip } from "antd";
import { useQueryParams } from "../../hooks/useQueryParams";
import { useProjectDetailsQuery } from "../../hooks/query";
import PhasesHeader from "./PhasesHeader";
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
  const params = useParams();
  const qp = useQueryParams();
  const custom_phase = qp.get("custom_phase") || null;
  // const [selectedPhase, setSelectedPhase] = useState(null);
  const [showBacklogCreator, setShowBacklogCreator] = useState(false);
  const [cycleModal, setCycleModal] = useState(null);
  // edit button logic
const [isEditingPhase, setIsEditingPhase] = useState(false);
const [phaseTitle, setPhaseTitle] = useState("");
const phaseInputRef = useRef(null);

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
  const [activeId, setActiveId] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(true);

  const toggleTaskSelection = useCallback((taskId, ctrlKey) => {
    if (!ctrlKey) {
      setSelectedTasks(new Set());
      return;
    }
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);
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

  const defaultPhase = useMemo(() => {
    const active = cycles_query3?.data?.message?.active_phase || null;
    if (active) return active
    return phases.length > 0 ? phases[phases.length - 1] : null
  }, [cycles_query3.data, phases]);

  useEffect(() => {
    if (!custom_phase && defaultPhase) {
      qp.set("custom_phase", defaultPhase.name);
    }
  }, [defaultPhase, custom_phase]);

  const all_tasks = useMemo(() => {
    return cycles_query3?.data?.message?.all_tasks || [];
  }, [cycles_query3.data]);
  const cycles = useMemo(() => {
    return cycles_query3?.data?.message?.cycles_by_phase[custom_phase] || [];
  }, [cycles_query3.data, custom_phase, defaultPhase]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    if (!selectedTasks.has(event.active.id)) {
      setSelectedTasks(new Set());
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
    setSelectedTasks(new Set());
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
          project={project_id}
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
            {/* Left Panel - Phase Details */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
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


                    <div className="flex items-center justify-between mt-2">
                      {isEditingPhase ? (
                        <Input
                          ref={phaseInputRef}
                          size="small"
                          value={phaseTitle}
                          onChange={(e) => setPhaseTitle(e.target.value)}
                          onPressEnter={handlePhaseUpdate}
                          onBlur={handlePhaseUpdate}
                          className="text-lg font-black tracking-tight"
                        />
                      ) : (
                        <>
                          <h3 className="text-lg sm:text-xl font-black tracking-tight truncate">
                            {selectedPhase?.title}
                          </h3>
                          <Button
                            type="text"
                            size="small"
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            icon={<Edit2 size={14} />}
                            onClick={() => {
                              setPhaseTitle(selectedPhase?.title || "");
                              setIsEditingPhase(true);
                            }}
                          />
                        </>
                      )}
                    </div>



                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  <Space size={8} className="w-full">
                    <Button
                      type="text"
                      size="small"
                      onClick={() => {
                        window.open(
                          `/app/project-phase/${selectedPhase.name}`,
                          "_blank",
                        );
                      }}
                    >
                      <ArrowUpRight size={16} />
                    </Button>
                    <Tooltip
                      title={
                        !deleteMutation.loading && (backlogTasks.length > 0 || cycles.length > 0)
                          ? "Remove all tasks and cycles before deleting"
                          : undefined
                      }
                    >
                      <Button
                        disabled={
                          deleteMutation.loading ||
                          backlogTasks.length > 0 ||
                          cycles.length > 0
                        }
                        type="text"
                        size="small"
                        danger
                        icon={<Trash size={16} />}
                        onClick={() => {
                          const previousPhase = phases.find(
                            (p) =>
                              phases.indexOf(p) ===
                              phases.indexOf(selectedPhase) - 1,
                          );

                          deleteMutation
                            .deleteDoc("Project Phase", selectedPhase.name)
                            .then(() => {
                              cycles_query3.mutate().then(() => {
                                if (previousPhase) {
                                  qp.set("custom_phase", previousPhase.name);
                                }
                              });
                            });
                        }}
                      >
                        Delete
                      </Button>
                    </Tooltip>
                      <Select
                        value={selectedPhase?.status || "Planned"}
                      variant="borderless"
                      size="small"
                      popupMatchSelectWidth={false}
                      style={{ width: "100%" }}
                      options={[
                        { value: "Planned", label: "Planned" },
                        { value: "Active", label: "Active" },
                        { value: "Completed", label: "Completed" },
                      ]}
                      onChange={(value) => {
                        updateMutation
                          .updateDoc("Project Phase", selectedPhase.name, {
                            status: value,
                          })
                          .then(() => {
                            cycles_query3.mutate();
                          });
                      }}
                    />
                  </Space>

                  {/* Phase Progress */}
                  <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 text-white relative overflow-hidden">
                    <div className="relative">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">
                        Phase Progress
                      </div>
                      <div className="flex items-end justify-between mb-3 gap-2">
                        <span className="text-3xl sm:text-4xl font-black tracking-tighter">
                          {0}%
                        </span>
                        <span className="text-xs font-bold text-slate-400 mb-1">
                          {0} Tasks
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-1000"
                          style={{ width: `${0}%` }}
                        />
                      </div>
                    </div>
                    <TrendingUp
                      className="absolute -right-2 -bottom-2 text-white/5"
                      size={80}
                    />
                  </div>

                  {/* Dates Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Start Date
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {selectedPhase?.start_date || "-"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">
                        End Date
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {selectedPhase?.end_date || "-"}
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-600 transition-all">
                    Phase Report
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Tasks */}
            <div className="flex-1 min-w-0">
              <div className="grid gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-200px)]">
                {/* Cycles */}
                {isScrum && (
                  <div className="space-y-3">
                    {cycles.map((cycle) => (
                      <Cycle key={cycle.name} cycle={cycle} deleteMutation={deleteMutation} cycles_query3={cycles_query3} setCycleModal={setCycleModal} selectedTasks={selectedTasks} toggleTaskSelection={toggleTaskSelection} />
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
                        onClick={() => setIsBacklogExpanded(!isBacklogExpanded)}
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
                          onCreated={() => {
                            setShowBacklogCreator(false);
                            cycles_query3.mutate();
                          }}
                          onCancel={() => setShowBacklogCreator(false)}
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
                        <TaskCard key={t.id} task={t} selectedTasks={selectedTasks} toggleTaskSelection={toggleTaskSelection} />
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
