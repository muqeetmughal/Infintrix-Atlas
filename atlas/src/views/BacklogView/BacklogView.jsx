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
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  Plus,
  MoreVertical,
  CheckSquare,
  Calendar,
  Clock,
  Zap,
  RotateCcw,
  Layers,
  Trello,
  ShieldAlert,
  GripVertical,
  ChevronRight,
  Package,
  CalendarPlus,
  CheckCheck,
  Archive,
  DeleteIcon,
  Delete,
  Trash,
  MenuIcon,
  ArrowUpRight,
  X,
  TrendingUp,
} from "lucide-react";
import {
  useFrappeCreateDoc,
  useFrappeDeleteDoc,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
  useSWRConfig,
} from "frappe-react-sdk";
import dayjs from "dayjs";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Dropdown, Input, message, Select, Space, Spin } from "antd";
import BacklogHealth from "../../components/ProjectHealth";
import FormRender from "../../components/form/FormRender";
import { useQueryParams } from "../../hooks/useQueryParams";
import { useProjectDetailsQuery, useTasksQuery } from "../../hooks/query";
import WorkItemTypeWidget from "../../components/widgets/WorkItemTypeWidget";
import StatusWidget from "../../components/widgets/StatusWidget";
import PhasesHeader from "./PhasesHeader";
// --- Constants ---

const TASK_STATUS_COLORS = {
  Backlog: "bg-slate-100 text-slate-600",
  Todo: "bg-blue-50 text-blue-600",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Done: "bg-emerald-100 text-emerald-700",
};

// --- Components ---

const Badge = ({ children, className }) => (
  <span
    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border transition-all ${className}`}
  >
    {children}
  </span>
);

const TaskCard = ({ task, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const [searchParams, setSearchParams] = useSearchParams();
  const swr = useSWRConfig();
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        const el = e.target.closest?.(
          "button, a, input, textarea, select, [role='button'], [role='combobox'], [role='menuitem'], .ant-dropdown, .ant-select, .ant-picker",
        );
        if (el) return;
        if (task.id === "new_item") return;
        searchParams.set("selected_task", task.id);
        setSearchParams(searchParams);
      }}
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-start gap-3 group
        ${isDragging && !isOverlay ? "opacity-30" : "opacity-100"}
        ${
          isOverlay
            ? "shadow-xl ring-2 ring-indigo-500 dark:ring-indigo-400 cursor-grabbing"
            : "cursor-grab active:cursor-grabbing"
        }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-1 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500"
      >
        <GripVertical size={14} />
      </div>
      <div className="flex-1 pointer-events-none">
        <div className="flex justify-between items-start mb-1">
          <div className="flex justify-start space-x-4 items-center pointer-events-auto cursor-pointer">
            <WorkItemTypeWidget
              value={task.type}
              onChange={(newType) => {
                updateMutation
                  .updateDoc("Task", task.name, {
                    type: newType,
                  })
                  .then(() => {
                    swr.mutate(["Task"]);
                    // task_details_query.mutate();
                  });
              }}
            />

            <h4
              onClick={(e) => {
                e.stopPropagation();
                if (task.id === "new_item") return;
                // console.log("Issue clicked:", issue, issue);
                searchParams.set("selected_task", task.id);
                setSearchParams(searchParams);
              }}
              className="pointer-events-auto text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:underline"
            >
              {task.subject}
            </h4>
          </div>
          <StatusWidget value={task.status} />
        </div>
      </div>
    </div>
  );
};

const DroppableZone = ({ id, children, className, isOverColor }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} transition-all duration-200 ${
        isOver ? isOverColor : ""
      }`}
    >
      {children}
    </div>
  );
};

// --- Main App ---

const InlineTaskCreator = ({
  project_id,
  phase_id,
  cycle = null,
  onCreated,
  onCancel,
}) => {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const createMutation = useFrappeCreateDoc();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const createTask = async () => {
    if (!value.trim()) return;

    setLoading(true);
    try {
      const doc = await createMutation.createDoc("Task", {
        subject: value,
        project: project_id,
        custom_phase: phase_id,
        custom_cycle: cycle ? cycle : undefined,
        status: "Open",
      });

      onCreated?.(doc);
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl px-3 py-2 shadow-sm">
      <Input
        ref={inputRef}
        size="small"
        placeholder="What needs to be done?"
        value={value}
        disabled={loading}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={createTask}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        suffix={loading ? <Spin size="small" /> : null}
        variant="borderless"
        className="dark:text-slate-100 dark:placeholder-slate-400"
      />
    </div>
  );
};

const BacklogView = () => {
  // const [tasks, setTasks] = useState(initialTasks);
  const params = useParams();
  const qp = useQueryParams();
  const custom_phase = qp.get("custom_phase") || null;
  // const [selectedPhase, setSelectedPhase] = useState(null);
  const [showBacklogCreator, setShowBacklogCreator] = useState(false);
  const [setCycleModal] = useState(null);
  const { mutate } = useSWRConfig();
  const project_id = qp.get("project") || null;
  const statusFilter = qp.getArray("status");
  const priorityFilter = qp.getArray("priority");
  const searchText = (qp.get("search") || "").toLowerCase();
  const updateMutation = useFrappeUpdateDoc();
  const set_cycle_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.set_cycle_for_task",
  );
  const createMutation = useFrappeCreateDoc();
  const deleteMutation = useFrappeDeleteDoc();
  const complete_cycle_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.complete_cycle",
  );
  const [activeId, setActiveId] = useState(null);
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(true);
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
  const activePhase = useMemo(() => {
    return cycles_query3?.data?.message?.active_phase || null;
  }, [cycles_query3.data]);

  useEffect(() => {
    if (!custom_phase && activePhase) {
      qp.set("custom_phase", activePhase.name);
    }
  }, [activePhase, custom_phase]);

  const all_tasks = useMemo(() => {
    return cycles_query3?.data?.message?.all_tasks || [];
  }, [cycles_query3.data]);
  const cycles = useMemo(() => {
    return (
      cycles_query3?.data?.message?.cycles_by_phase[
        custom_phase
      ] || []
    );
  }, [cycles_query3.data, custom_phase, activePhase]);

  const phases = useMemo(() => {
    return cycles_query3?.data?.message?.phases || [];
  }, [cycles_query3.data, custom_phase, activePhase]);

  const handleDragStart = (event) => {
    console.log("Drag started:", event);
    setActiveId(event.active.id);
  };

  const backlogTasks = useMemo(() => {
    return (
      cycles_query3?.data?.message?.backlog_by_phase[
        custom_phase
      ] || []
    );
  }, [cycles_query3.data, custom_phase]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over) {
      handleMoveTask(active.id, over.id);
    }
    setActiveId(null);
  };

  const handleMoveTask = useCallback(
    (taskId, targetId) => {
      console.log("Moving task", taskId, "to", targetId);
      // if (isScrum && hasActiveCycle && targetId === active_cycle_name) {
      //   message.error(
      //     "Cannot move task to active cycle. Please complete the active cycle before moving tasks into it.",
      //   );
      //   return;
      // }

      set_cycle_mutation
        .call({
          task_name: taskId,
          cycle_name: targetId === "Open" ? null : targetId,
        })
        .then((response) => {
          console.log("Set cycle response:", response);
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
              cycle.status === "Planned" &&
              !hasActiveCycle && (
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
              <span className="text-[10px] font-black uppercase">
                Plan Task
              </span>
            </button>
          </div>
        )}
      </DroppableZone>
    );
  };

  const activeTask = useMemo(
    () => all_tasks.find((t) => t.id === activeId),
    [all_tasks, activeId],
  );
  const selectedPhase = useMemo(() => {
    return phases.find((p) => p.name === custom_phase) || activePhase;
  }, [phases, custom_phase, activePhase]);

  if (cycles_query3.isLoading) return <div>Loading...</div>;

  return (
    <>
      <PhasesHeader phases={phases} />

      {(phases.length !== 0 && selectedPhase) && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
                    <h3 className="text-lg sm:text-xl font-black tracking-tight mt-2 truncate">
                      {selectedPhase?.title}
                    </h3>
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
                        // const currentPhase = selectedPhase;
                        const previousPhase = phases.find(
                          (p) =>
                            phases.indexOf(p) ===
                            phases.indexOf(selectedPhase) - 1,
                        );
                        console.log(" previousPhase:", previousPhase);

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
                    <Select
                      disabled={backlogTasks.length > 0 || cycles.length > 0}
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
                      <Cycle key={cycle.name} cycle={cycle} />
                    ))}
                  </div>
                )}

                {/* Backlog */}
                <DroppableZone
                  id="Open"
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
                        <TaskCard key={t.id} task={t} />
                      ))}
                    </div>
                  )}
                </DroppableZone>
              </div>

              <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
              </DragOverlay>
            </div>
          </div>
        </DndContext>
      )}
    </>
  );
};
export default BacklogView;
