import { useFrappeGetDoc } from "frappe-react-sdk";

// console.log(query.data)
// http://localhost:8000/api/method/frappe.desk.doctype.kanban_board.kanban_board.get_kanban_boards

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  Clock,
  Check,
  X,
  Search,
  Filter,
  Layout,
} from "lucide-react";
import { useTasksQueryForField } from "../../hooks/query";
import { useQueryParams } from "../../hooks/useQueryParams";

/**
 * INITIAL DATA CONSTANTS
 */

// const query = {
//   isLoading: false,
//   data: {
//     name: "task-status",
//     owner: "Administrator",
//     creation: "2026-02-27 17:17:44.479831",
//     modified: "2026-02-27 17:17:44.479831",
//     modified_by: "Administrator",
//     docstatus: 0,
//     idx: 0,
//     kanban_board_name: "task-status",
//     reference_doctype: "Task",
//     field_name: "status",
//     private: 0,
//     show_labels: 0,
//     fields: '["priority","project","status"]',
//     doctype: "Kanban Board",
//     columns: [
//       {
//         name: "sgk7fm8r6r",
//         owner: "Administrator",
//         creation: "2026-02-27 17:17:44.479831",
//         modified: "2026-02-27 17:17:44.479831",
//         modified_by: "Administrator",
//         docstatus: 0,
//         idx: 1,
//         column_name: "Open",
//         status: "Active",
//         indicator: "Gray",
//         order:
//           '[\n "TASK-2026-00001",\n "TASK-2026-00002",\n "TASK-2026-00004",\n "TASK-2026-00069",\n "TASK-2026-00080",\n "TASK-2026-00039",\n "TASK-2026-00037",\n "TASK-2026-00038",\n "TASK-2026-00035",\n "TASK-2026-00070",\n "TASK-2026-00075",\n "TASK-2026-00034",\n "TASK-2026-00056",\n "TASK-2026-00055",\n "TASK-2026-00054",\n "TASK-2026-00053",\n "TASK-2026-00052",\n "TASK-2026-00045",\n "TASK-2026-00046",\n "TASK-2026-00044",\n "TASK-2026-00040",\n "TASK-2026-00011"\n]',
//         parent: "task-status",
//         parentfield: "columns",
//         parenttype: "Kanban Board",
//         doctype: "Kanban Board Column",
//       },
//       {
//         name: "sgko449336",
//         owner: "Administrator",
//         creation: "2026-02-27 17:17:44.479831",
//         modified: "2026-02-27 17:17:44.479831",
//         modified_by: "Administrator",
//         docstatus: 0,
//         idx: 2,
//         column_name: "Working",
//         status: "Active",
//         indicator: "Gray",
//         order:
//           '[\n "TASK-2026-00043",\n "TASK-2026-00058",\n "TASK-2026-00036",\n "TASK-2026-00060",\n "TASK-2026-00033"\n]',
//         parent: "task-status",
//         parentfield: "columns",
//         parenttype: "Kanban Board",
//         doctype: "Kanban Board Column",
//       },
//       {
//         name: "sgkgdkkm7g",
//         owner: "Administrator",
//         creation: "2026-02-27 17:17:44.479831",
//         modified: "2026-02-27 17:17:44.479831",
//         modified_by: "Administrator",
//         docstatus: 0,
//         idx: 3,
//         column_name: "Pending Review",
//         status: "Active",
//         indicator: "Gray",
//         order:
//           '[\n "TASK-2026-00079",\n "TASK-2026-00008",\n "TASK-2026-00057",\n "TASK-2026-00009",\n "TASK-2026-00064",\n "TASK-2026-00059",\n "TASK-2026-00007"\n]',
//         parent: "task-status",
//         parentfield: "columns",
//         parenttype: "Kanban Board",
//         doctype: "Kanban Board Column",
//       },
//       {
//         name: "sgk2cu5bmd",
//         owner: "Administrator",
//         creation: "2026-02-27 17:17:44.479831",
//         modified: "2026-02-27 17:17:44.479831",
//         modified_by: "Administrator",
//         docstatus: 0,
//         idx: 4,
//         column_name: "Completed",
//         status: "Active",
//         indicator: "Gray",
//         order:
//           '[\n "TASK-2026-00006",\n "TASK-2026-00081",\n "TASK-2026-00073",\n "TASK-2026-00076",\n "TASK-2026-00078",\n "TASK-2026-00077",\n "TASK-2026-00074",\n "TASK-2026-00072",\n "TASK-2026-00071",\n "TASK-2026-00065",\n "TASK-2026-00061",\n "TASK-2026-00051",\n "TASK-2026-00047",\n "TASK-2026-00050",\n "TASK-2026-00049",\n "TASK-2026-00048",\n "TASK-2026-00042",\n "TASK-2026-00041",\n "TASK-2026-00012",\n "TASK-2026-00014",\n "TASK-2026-00013"\n]',
//         parent: "task-status",
//         parentfield: "columns",
//         parenttype: "Kanban Board",
//         doctype: "Kanban Board Column",
//       },
//       {
//         name: "sgkamk0glg",
//         owner: "Administrator",
//         creation: "2026-02-27 17:17:44.479831",
//         modified: "2026-02-27 17:17:44.479831",
//         modified_by: "Administrator",
//         docstatus: 0,
//         idx: 5,
//         column_name: "Cancelled",
//         status: "Active",
//         indicator: "Gray",
//         order:
//           '[\n "TASK-2026-00067",\n "TASK-2026-00066",\n "TASK-2026-00063",\n "TASK-2026-00062"\n]',
//         parent: "task-status",
//         parentfield: "columns",
//         parenttype: "Kanban Board",
//         doctype: "Kanban Board Column",
//       },
//       {
//         name: "sgkjctivla",
//         owner: "Administrator",
//         creation: "2026-02-27 17:17:44.479831",
//         modified: "2026-02-27 17:17:44.479831",
//         modified_by: "Administrator",
//         docstatus: 0,
//         idx: 6,
//         column_name: "Template",
//         status: "Active",
//         indicator: "Gray",
//         order: '[\n "TASK-2026-00068"\n]',
//         parent: "task-status",
//         parentfield: "columns",
//         parenttype: "Kanban Board",
//         doctype: "Kanban Board Column",
//       },
//     ],
//   },
// };

const initialBoardData = [
  {
    id: "sgk7fm8r6r",
    column_name: "Open",
    indicator: "Gray",
    order: ["TASK-2026-00001", "TASK-2026-00002", "TASK-2026-00004"],
  },
  {
    id: "sgko449336",
    column_name: "Working",
    indicator: "Blue",
    order: ["TASK-2026-00043", "TASK-2026-00058"],
  },
  {
    id: "sgkgdkkm7g",
    column_name: "Pending Review",
    indicator: "Orange",
    order: ["TASK-2026-00079"],
  },
];

const initialTaskDetails = {
  "TASK-2026-00001": {
    title: "Fix Authentication Middleware",
    priority: "High",
    project: "SaaS Platform",
  },
  "TASK-2026-00002": {
    title: "Refactor Database Schema",
    priority: "Medium",
    project: "Internal Tool",
  },
  "TASK-2026-00004": {
    title: "Setup CI/CD Pipeline",
    priority: "Critical",
    project: "Client Alpha",
  },
  "TASK-2026-00043": {
    title: "API Integration: Stripe",
    priority: "High",
    project: "E-commerce",
  },
  "TASK-2026-00058": {
    title: "Design System Audit",
    priority: "Low",
    project: "Internal Tool",
  },
  "TASK-2026-00079": {
    title: "Code Review: Auth Module",
    priority: "High",
    project: "SaaS Platform",
  },
};

/**
 * KANBAN CARD COMPONENT
 */
const KanbanCard = ({ id, task, isOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const priorityColors = {
    High: "text-red-600 bg-red-50",
    Medium: "text-amber-600 bg-amber-50",
    Low: "text-emerald-600 bg-emerald-50",
    Critical: "text-purple-600 bg-purple-50",
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="mb-3 h-32 w-full rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative mb-3 cursor-grab overflow-hidden rounded-xl border border-slate-200 bg-white p-4 
        shadow-sm transition-all hover:border-blue-400 hover:shadow-md active:cursor-grabbing
        ${isOverlay ? "shadow-2xl ring-2 ring-blue-500 rotate-2 scale-105 z-50" : ""}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[task?.priority] || "bg-slate-50 text-slate-500"}`}
        >
          {task?.priority || "Low"}
        </span>
        <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={14} />
        </button>
      </div>

      <h3 className="mb-1 text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
        {task?.title || id}
      </h3>
      <p className="mb-3 text-[11px] text-slate-400 font-medium">
        {task?.project || "General"}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px]">
            <MessageSquare size={12} /> 0
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <Paperclip size={12} /> 0
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <Clock size={10} /> Just now
        </div>
      </div>
    </div>
  );
};

/**
 * KANBAN COLUMN COMPONENT
 */
const KanbanColumn = ({ column, onAddTask }) => {
  const qp = useQueryParams();
  const project = qp.get("project") || null;
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef(null);

  const task_query = useTasksQueryForField(
    project,
    "status",
    column.column_name,
  );

  //   console.log("Tasks for ", column.column_name, task_query.data)
  const tasks = task_query.data || [];

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddTask(column.id, newTitle.trim());
      setNewTitle("");
      setIsAdding(false);
    }
  };

  const indicatorColors = {
    Gray: "bg-slate-400",
    Blue: "bg-blue-500",
    Orange: "bg-orange-500",
    Green: "bg-emerald-500",
  };

  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col rounded-2xl bg-slate-50/80 p-2 ring-1 ring-slate-200/50">
      <div className="mb-3 flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${indicatorColors[column.indicator] || "bg-slate-400"}`}
          />
          <h2 className="text-sm font-bold text-slate-700">
            {column.column_name}
          </h2>
          <span className="ml-1 rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
            {tasks.length}
          </span>
        </div>
        <button className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 custom-scrollbar pb-4">
        {isAdding ? (
          <div className="mb-3 rounded-xl border border-blue-200 bg-white p-3 shadow-sm ring-2 ring-blue-100">
            <textarea
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
                if (e.key === "Escape") setIsAdding(false);
              }}
              placeholder="What needs to be done?"
              className="mb-3 w-full resize-none border-none p-0 text-sm focus:ring-0 placeholder:text-slate-300"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsAdding(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Check size={14} />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="group flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-transparent px-3 py-3 text-sm text-slate-400 transition-all hover:border-slate-200 hover:bg-white/50 hover:text-slate-600"
          >
            <Plus
              size={16}
              className="text-slate-300 group-hover:text-slate-500"
            />
            <span className="font-medium text-xs">Add Card</span>
          </button>
        )}
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.name} id={task.name} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

/**
 * MAIN APP COMPONENT
 */
export default function App() {
  const [columns, setColumns] = useState(initialBoardData);
  const [taskDetails, setTaskDetails] = useState(initialTaskDetails);
  const [activeId, setActiveId] = useState(null);
  const [lastMove, setLastMove] = useState(null); // Tracking the move state

  const query = useFrappeGetDoc("Kanban Board", "task-status", "kanban_board_task_status", {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });
//   console.log("Kanban Board Query Result:", query.data);

  const columns_list = (query?.data?.columns||[]).map((col) => ({
    id: col.name,
    column_name: col.column_name,
    indicator: col.indicator,
    order: JSON.parse(col.order),
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddTask = (columnId, title) => {
    const newId = `TASK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Optimistic UI Update
    setTaskDetails((prev) => ({
      ...prev,
      [newId]: { title, priority: "Medium", project: "SaaS Platform" },
    }));

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === columnId) {
          return { ...col, order: [newId, ...col.order] }; // Add to top
        }
        return col;
      }),
    );
  };

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;

    const activeColumn = findColumn(activeId);
    const overColumn =
      columns_list.find((col) => col.id === overId) || findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;
    
    query.mutate(
        async (current) => {
            console.log("Mutating with activeId:", activeId, "overId:", overId);
            const activeItems = current.columns.find((c) => c.name === activeColumn.id).order;
            const overItems = current.columns.find((c) => c.name === overColumn.id).order;

            const overIndex = overItems.includes(overId)
                ? overItems.indexOf(overId)
                : overItems.length;

            const updatedColumns = current.columns.map((col) => {
                if (col.name === activeColumn.id) {
                    return { ...col, order:JSON.pa(activeItems).filter((i) => i !== activeId) };
                }
                if (col.name === overColumn.id) {
                    const newOrder = [...overItems];
                    newOrder.splice(overIndex, 0, activeId);
                    return { ...col, order: newOrder };
                }
                return col;
            });

            return { ...current, columns: updatedColumns };
        },
        {
            optimisticData: (current) => {
                // console.log("Optimistically updating with activeId:", activeId, "overId:", overId,current);
                const activeItems = current.columns.find((c) => c.name === activeColumn.id).order;
                const overItems = current.columns.find((c) => c.name === overColumn.id).order;
                const overIndex = overItems.includes(overId) ? overItems.indexOf(overId) : overItems.length;
                
                console.log("activeItems:", JSON.parse( activeItems),activeId)
                return {
                    ...current,
                    columns: current.columns.map((col) => {
                        if (col.name === activeColumn.id) {
                            return { ...col, order:  JSON.parse(activeItems).filter((i) => i !== activeId) };
                        }
                        if (col.name === overColumn.id) {
                            const newOrder = [...overItems];
                            newOrder.splice(overIndex, 0, activeId);
                            return { ...col, order: newOrder };
                        }
                        return col;
                    }),
                };
            },
            rollbackOnError: true,
            revalidate: false,
            populateCache: true,
        }
    );
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeColumn = findColumn(active.id);
    const overColumn =
      columns_list.find((col) => col.id === over.id) || findColumn(over.id);

    if (activeColumn && overColumn) {
      const oldIndex = activeColumn.order.indexOf(active.id);
      const newIndex = overColumn.order.indexOf(active.id);

      // RECORD THE MOVE STATE
      // This is what you send to your API
      setLastMove({
        taskId: active.id,
        fromColumn: activeColumn.column_name,
        toColumn: overColumn.column_name,
        oldIndex,
        newIndex,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (activeColumn.id === overColumn.id && active.id !== over.id) {
        query.mutate(
            async (current) => {
                const activeItems = current.columns.find((c) => c.name === activeColumn.id).order;
                const oldIdx = activeItems.indexOf(active.id);
                const newIdx = activeItems.indexOf(over.id);
                
                return {
                    ...current,
                    columns: current.columns.map((col) => {
                        if (col.name === activeColumn.id) {
                            return { ...col, order: JSON.stringify(arrayMove(JSON.parse(col.order), oldIdx, newIdx)) };
                        }
                        return col;
                    }),
                };
            },
            {
                optimisticData: (current) => {
                    
                    const activeItems = JSON.parse(current.columns.find((c) => c.name === activeColumn.id).order);
                    const oldIdx = activeItems.indexOf(active.id);
                    const newIdx = activeItems.indexOf(over.id);
                    
                    return {
                        ...current,
                        columns: current.columns.map((col) => {
                            if (col.name === activeColumn.id) {
                                return { ...col, order: arrayMove(activeItems, oldIdx, newIdx) };
                            }
                            return col;
                        }),
                    };
                },
                rollbackOnError: true,
                revalidate: false,
                populateCache: true,
            }
        );
      }
    }

    setActiveId(null);
  };

  const findColumn = useCallback(
    (taskId) => {
      const found = columns_list.find((col) => col.order.includes(taskId));
      return found;
    },
    [columns_list],
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      {/* Dynamic Header */}
      {/* <header className="z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-1.5 text-white">
              <Layout size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Sprint Board</h1>
          </div>
          
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            <button className="rounded-full bg-white px-4 py-1 text-xs font-bold text-slate-700 shadow-sm">Board</button>
            <button className="rounded-full px-4 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">List</button>
            <button className="rounded-full px-4 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">Timeline</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="w-64 rounded-xl border-none bg-slate-100 pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-95">
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>
      </header> */}

      {/* Kanban Main Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex h-full gap-6 items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {columns_list.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={column.order}
                allTaskDetails={taskDetails}
                onAddTask={handleAddTask}
              />
            ))}

            <DragOverlay>
              {activeId ? (
                <KanbanCard
                  id={activeId}
                  task={taskDetails[activeId]}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>

          <button className="flex w-80 flex-shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-400 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-600">
            <Plus size={20} />
            <span>Add List</span>
          </button>
        </div>
      </main>

      {/* Sync Status / Activity Log (Brutally Honest Movement Tracking) */}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}
