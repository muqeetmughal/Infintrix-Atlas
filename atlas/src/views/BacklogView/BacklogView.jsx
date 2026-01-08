import React, { useState, useMemo, useCallback, use } from "react";
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
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { Button, Dropdown, Space, Spin } from "antd";
import BacklogHealth from "./BacklogHealth";
import FormRender from "../../components/form/FormRender";
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
  // console.log("Rendering TaskCard", task);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-slate-200 p-2 rounded-xl shadow-sm hover:border-indigo-300 transition-all flex items-start gap-3 group 
        ${isDragging && !isOverlay ? "opacity-30" : "opacity-100"} 
        ${
          isOverlay
            ? "shadow-xl ring-2 ring-indigo-500 cursor-grabbing"
            : "cursor-grab active:cursor-grabbing"
        }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-1 text-slate-300 group-hover:text-slate-400"
      >
        <GripVertical size={14} />
      </div>
      <div className="flex-1 pointer-events-none">
        <div className="flex justify-between items-start mb-1">
          <div className="flex justify-start space-x-4 items-center">
            <Badge
              className={
                task.type === "Bug"
                  ? "bg-rose-50 text-rose-600 border-rose-100"
                  : "bg-slate-50 text-slate-500 border-slate-100"
              }
            >
              {task.type}
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
              {task.id}
            </span>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {task.subject}
            </h4>
          </div>
          <Badge className={TASK_STATUS_COLORS[task.status]}>
            {task.status}
          </Badge>
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

const BacklogView = () => {
  //   const [tasks, setTasks] = useState(initialTasks);
  const params = useParams();
  const [cycleModal, setCycleModal] = React.useState({
    open: false,
    data: null,
  });

  const project_id = params.project;
  const updateMutation = useFrappeUpdateDoc();
  const createMutation = useFrappeCreateDoc();
  const deleteMutation = useFrappeDeleteDoc();
  const [activeId, setActiveId] = useState(null);
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(true);
  const project_query = useFrappeGetDoc("Project", project_id);

  const cycles_query = useFrappeGetDocList("Cycle", {
    filters: { project: project_id },
    fields: ["*"],
    orderBy: {
      field: "creation",
      order: "desc", // Sort from newest to oldest
    },
    limit: 1000,
    limit_start: 0,
  });
  const tasks_query = useFrappeGetDocList("Task", {
    filters: { project: project_id },
    fields: ["name as id", "name", "subject", "custom_cycle", "type", "status"],
  });

  const project = project_query.data || {};
  const hasActiveCycle = useMemo(
    () => (cycles_query.data || []).some((cycle) => cycle.status === "Active"),
    [cycles_query.data]
  );
  const isScrum = project.custom_execution_mode === "Scrum";

  const tasks = tasks_query.data || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Derived filters
  const backlogTasks = useMemo(() => {
    return tasks.filter((t) =>
      isScrum ? !t.custom_cycle : t.status === "Open"
    );
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
    // console.log(`Move Task ${taskId} to ${targetId}`);
    updateMutation
      .updateDoc("Task", taskId, {
        custom_cycle: targetId === "Open" ? null : targetId,
      })
      .then(() => {
        tasks_query.mutate();
      });

    // setTasks((prev) =>
    //   prev.map((t) => {
    //     if (t.id === taskId) {
    //       if (targetId === "Open") {
    //         return { ...t, cycle: null, status: "Open" };
    //       } else {
    //         // targetId is a Cycle Name
    //         return {
    //           ...t,
    //           cycle: targetId,
    //           status: t.status === "Open" ? "Todo" : t.status,
    //         };
    //       }
    //     }
    //     return t;
    //   })
    // );
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

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId),
    [tasks, activeId]
  );
  const Cycle = ({ cycle, tasks = [] }) => {
    // const project = params.project;
    const [isExpanded, setIsExpanded] = useState(false);
    // const tasks_query = useFrappeGetDocList("Task", {
    //   filters: { custom_cycle: cycle.name, project: project },
    //   fields: ["*"],
    // });
    // const tasks = tasks_query.data || [];
    // if (tasks_query.isLoading) return <div>Loading...</div>;
    const cycle_tasks = tasks.filter((t) => t.custom_cycle === cycle.name);
    const hasNoWorkItems = cycle_tasks.length === 0;
    return (
      <DroppableZone
        key={cycle.name}
        id={cycle.name}
        isOverColor="bg-indigo-50 ring-2 ring-indigo-400"
        className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm group hover:border-indigo-200 transition-all"
      >
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 flex-1 space-y-1">
            <div className="flex items-center gap-4">
              <ChevronRight
                onClick={() => setIsExpanded(!isExpanded)}
                size={20}
                className={`text-slate-400 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </div>
            <div
              className={`p-2 rounded-xl ${
                cycle.status === "Active"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : cycle.status === "Completed"
                  ? "bg-emerald-100 text-emerald-600"
                  : cycle.status === "Planned"
                  ? "bg-blue-100 text-blue-600"
                  : cycle.status === "Archived"
                  ? "bg-slate-100 text-slate-400"
                  : "bg-slate-100 text-slate-400"
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
              <h3 className="font-semibold text-slate-900 leading-none">
                {cycle.name}{" "}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
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
                      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                      : cycle.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : cycle.status === "Planned"
                      ? "bg-blue-50 text-blue-700 border-blue-100"
                      : cycle.status === "Archived"
                      ? "bg-slate-50 text-slate-400 border-slate-100"
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  }
                >
                  {cycle.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isExpanded && cycle.status=="Planned" && (
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

            {(hasActiveCycle && cycle.status !== "Active") ||
            cycle.status == "Completed" ? null : (
              <Button
                disabled={hasNoWorkItems}
                size="small"
                type={cycle.status === "Active" ? "default" : "primary"}
                onClick={() => {
                  updateMutation
                    .updateDoc("Cycle", cycle.name, {
                      status:
                        cycle.status === "Active" ? "Completed" : "Active",
                    })
                    .then(() => {
                      cycles_query.mutate();
                    });
                }}
              >
                {cycle.status === "Active" ? "Complete" : "Start Cycle"}
              </Button>
            )}

            <Dropdown
          
            trigger={'click'}
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
                  }
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
            <button className="border-2 border-dashed border-slate-100 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-300 hover:text-indigo-500 hover:border-indigo-100 transition-all">
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
  if (cycles_query.isLoading || tasks_query.isLoading)
    return <div>Loading...</div>;

  const cycles = cycles_query.data || [];
  // console.log("Tasks", tasks);
  return (
    <>
      {
        <FormRender
          doctype="Cycle"
          open={cycleModal.open}
          onClose={() => setCycleModal({ open: false, data: null })}
          full_form={false}
          // defaultValues={
          //   {
          //     // project: project || "",
          //   }
          // }
        />
      }
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="max-w-8xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
          {/* Header */}
          {/* <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              {isScrum ? <RotateCcw size={28} /> : <Trello size={28} />}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                Backlog
              </h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {isScrum ? "Sprint Planning" : "Intake Management"}
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                {project.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isScrum && (
              <button
                onClick={addCycle}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <CalendarPlus size={16} className="text-indigo-600" />
                <span>Create Cycle</span>
              </button>
            )}
         
          </div>
        </header> */}

          {/* Main Viewport */}
          <div
            className={`grid gap-8 ${
              isScrum ? "grid-cols-1 lg:grid-cols-1" : "max-w-2xl mx-auto"
            }`}
          >
           
            <div className="lg:col-span-8 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              <DroppableZone
                // key={cycle.name}
                id="Open"
                isOverColor="bg-indigo-50 ring-2 ring-indigo-400"
                className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm group hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 flex-1 space-y-1">
                    <div className="flex items-center gap-4">
                      <ChevronRight
                        onClick={() => setIsBacklogExpanded(!isBacklogExpanded)}
                        size={20}
                        className={`text-slate-400 transition-transform ${
                          isBacklogExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                    <div
                      className={`p-2 rounded-xl bg-indigo-600 text-white shadow-lg`}
                    >
                      <Package size={20} />
                    </div>
                    <div className="flex items-center">
                      <h3 className="font-semibold text-slate-900 leading-none">
                        Backlog{" "}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {/* {cycle.start_date} — {cycle.end_date} */}
                        </span>
                        <small className="text-xs font-light">
                          ({backlogTasks.length} Work Items)
                        </small>
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={
                            "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }
                        >
                          Backlog
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => {
                        createMutation
                          .createDoc("Cycle", {
                            project: project_id,
                            name: `New Cycle ${dayjs().format("MM-DD")}`,
                          })
                          .then(() => {
                            cycles_query.mutate();
                          });
                      }}
                    >
                      Create Cycle
                    </Button>
                    <ChevronRight
                      size={20}
                      className={`text-slate-400 transition-transform ${
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
                    <button className="border-2 border-dashed border-slate-100 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-300 hover:text-indigo-500 hover:border-indigo-100 transition-all">
                      <Plus size={16} />
                      <span className="text-[10px] font-black uppercase">
                        Plan Task
                      </span>
                      
                    </button>
                  </div>
                )}
              </DroppableZone>
            </div>

             {isScrum && (
              <div className="lg:col-span-8 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {cycles.map((cycle) => {
                  // const [isExpanded, setIsExpanded] = useState(false);

                  return <Cycle key={cycle.name} cycle={cycle} tasks={tasks} />;
                })}
              </div>
            )}
            {/* <div className={`w-full`}>
            {(() => {
              const [isExpanded, setIsExpanded] = useState(true);

              return (
                <>
                  <div
                    className="mb-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Package size={14} />
                      Project Backlog
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                        {backlogTasks.length}
                      </span>
                      <ChevronRight
                        size={16}
                        className={`text-slate-400 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <DroppableZone
                      id="backlog"
                      isOverColor="bg-slate-100 ring-2 ring-slate-300"
                      className="bg-white border border-slate-200 rounded-[32px] p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 animate-in fade-in duration-200"
                    >
                      {backlogTasks.length > 0 ? (
                        backlogTasks.map((t) => (
                          <TaskCard key={t.id} task={t} />
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center">
                          <ShieldAlert size={40} className="mb-4 opacity-10" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                            System is Calm
                          </p>
                          <p className="text-[10px] font-bold mt-1 text-slate-400">
                            No pending work found.
                          </p>
                        </div>
                      )}
                    </DroppableZone>
                  )}
                </>
              );
            })()}
          </div> */}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>

          {/* Footer Stats */}

          <BacklogHealth project_id={project_id} />
        </div>
      </DndContext>
    </>
  );
};
export default BacklogView;
// export default function App() {
//   return (
//     <div className="min-h-screen bg-slate-50 p-8">
//       <BacklogApp />
//     </div>
//   );
// }
