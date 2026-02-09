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
import { Button, Dropdown, Input, Space, Spin } from "antd";
import BacklogHealth from "../../components/ProjectHealth";
import FormRender from "../../components/form/FormRender";
import { useQueryParams } from "../../hooks/useQueryParams";
import { useProjectDetailsQuery, useTasksQuery } from "../../hooks/query";
import WorkItemTypeWidget from "../../components/widgets/WorkItemTypeWidget";
import StatusWidget from "../../components/widgets/StatusWidget";
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
        custom_cycle: cycle,
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
  //   const [tasks, setTasks] = useState(initialTasks);
  const params = useParams();
  const qp = useQueryParams();
  const [showBacklogCreator, setShowBacklogCreator] = useState(false);
  const { mutate } = useSWRConfig();
  const project_id = qp.get("project") || null;
  const updateMutation = useFrappeUpdateDoc();
  const createMutation = useFrappeCreateDoc();
  const deleteMutation = useFrappeDeleteDoc();
  const complete_cycle_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.complete_cycle",
  );
  const [activeId, setActiveId] = useState(null);
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(true);
  const project_query = useProjectDetailsQuery(project_id);

  const cycles_query = useFrappeGetDocList(
    "Cycle",
    {
      filters: { project: project_id },
      fields: ["*"],
      orderBy: {
        field: "status",
        order: "asc", // Sort from newest to oldest
      },
      limit: 1000,
      limit_start: 0,
    },
    project_id ? ["cycles", project_id] : null,
    {
      revalidateOnFocus: false,
    },
  );
  const tasks_query = useTasksQuery();

  const project = project_query.data || {};
  const hasActiveCycle = useMemo(
    () => (cycles_query.data || []).some((cycle) => cycle.status === "Active"),
    [cycles_query.data],
  );
  const isScrum = project.custom_execution_mode === "Scrum";

  const tasks = tasks_query.data || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Derived filters
  const backlogTasks = useMemo(() => {
    return tasks.filter((t) => (isScrum ? !t.cycle : t.status === "Open"));
  }, [tasks, isScrum]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over) {
      handleMoveTask(active.id, over.id);
    }
    setActiveId(null);
  };

  const handleMoveTask = useCallback((taskId, targetId) => {
    updateMutation
      .updateDoc("Task", taskId, {
        custom_cycle: targetId === "Open" ? null : targetId,
      })
      .then(() => {
        tasks_query.mutate();
        cycles_query.mutate();
        project_query.mutate();
      });
  }, []);

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

  const Cycle = ({ cycle, tasks = [] }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    // const project = params.project;
    const [isExpanded, setIsExpanded] = useState(false);
    const cycle_tasks = tasks.filter((t) => t.cycle === cycle.name);
    const hasNoWorkItems = cycle_tasks.length === 0;
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
            {isExpanded && cycle.status == "Planned" && (
              <Button
                type="text"
                size="small"
                icon={<Trash size={16} />}
                danger
                onClick={() => {
                  deleteMutation.deleteDoc("Cycle", cycle.name).then(() => {
                    cycles_query.mutate();
                  });
                }}
              >
                Delete
              </Button>
            )}

            {cycle.status !== "Active" &&
              cycle.status !== "Completed" &&
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
    () => tasks.find((t) => t.id === activeId),
    [tasks, activeId],
  );

  if (cycles_query.isLoading || tasks_query.isLoading)
    return <div>Loading...</div>;

  const cycles = cycles_query.data || [];
  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="max-w-8xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
          {/* Main Viewport */}
          <div
            className={`grid gap-8 ${
              isScrum ? "grid-cols-1 lg:grid-cols-1" : "max-w-2xl mx-auto"
            }`}
          >
            {isScrum && (
              <div className="lg:col-span-8 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {cycles.map((cycle) => {
                  return <Cycle key={cycle.name} cycle={cycle} tasks={tasks} />;
                })}
              </div>
            )}

            <div className="lg:col-span-8 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              <DroppableZone
                // key={cycle.name}
                id="Open"
                isOverColor="bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400 dark:ring-indigo-500"
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-600 transition-all"
              >
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 flex-1 space-y-1">
                    <div className="flex items-center gap-4">
                      <ChevronRight
                        onClick={() => setIsBacklogExpanded(!isBacklogExpanded)}
                        size={20}
                        className={`text-slate-400 dark:text-slate-500 transition-transform ${
                          isBacklogExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                    <div
                      className={`p-2 rounded-xl bg-indigo-600 dark:bg-indigo-700 text-white shadow-lg`}
                    >
                      <Package size={20} />
                    </div>
                    <div className="flex items-center">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-none">
                        Backlog{" "}
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                          {/* {cycle.start_date} — {cycle.end_date} */}
                        </span>
                        <small className="text-xs font-light">
                          ({backlogTasks.length} Work Items)
                        </small>
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={
                            "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800"
                          }
                        >
                          Backlog
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ChevronRight
                      size={20}
                      className={`text-slate-400 dark:text-slate-500 transition-transform ${
                        isBacklogExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>

                {isBacklogExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 animate-in fade-in duration-200">
                    {backlogTasks.map((t) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                    {showBacklogCreator ? (
                      <InlineTaskCreator
                        project_id={project_id}
                        onCreated={() => {
                          setShowBacklogCreator(false);
                          tasks_query.mutate();
                        }}
                        onCancel={() => setShowBacklogCreator(false)}
                      />
                    ) : (
                      <button
                        onClick={() => setShowBacklogCreator(true)}
                        className="border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all"
                      >
                        <Plus size={16} />
                        <span className="text-[10px] font-black uppercase">
                          Plan Task
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </DroppableZone>
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>

          {/* Footer Stats */}
        </div>
      </DndContext>
    </>
  );
};
export default BacklogView;
