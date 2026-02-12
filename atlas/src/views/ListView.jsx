import React, { useState, useMemo } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  PointerSensor,
} from "@dnd-kit/core";
import {
  MoreVertical,
  ChevronDown,
  GripVertical,
  Activity,
  Briefcase,
  AlertCircle,
  Hash,
  CheckSquare,
  UserPlus,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Select } from "antd";
import { useDoctypeSchema } from "../hooks/doctype";
import Card from "../components/ui/Card";
import PreviewAssignees from "../components/PreviewAssignees";
import { useTasksQuery } from "../hooks/query";
import { useQueryParams } from "../hooks/useQueryParams";

// --- Constants ---

const STATUS_CONFIG = {
  Backlog: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  Open: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
  Working: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
  "Pending Review": "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800",
  Completed: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
};

const COLOR_CONFIG = {
  status: {
    Backlog: { color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800" },
    Open: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
    Working: { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
    "Pending Review": { color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30" },
    Completed: { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  },
  priority: {
    Urgent: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle },
    High: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", icon: AlertCircle },
    Medium: { color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30", icon: Hash },
    Low: { color: "text-slate-400 dark:text-slate-500", bg: "bg-green-100 dark:bg-green-900/30", icon: Hash },
  },
};

// --- Sub-Components ---

const Badge = ({ children, className }) => (
  <span
    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border transition-all ${className}`}
  >
    {children}
  </span>
);

// --- Row UI (Pure Presentation) ---

const TaskRowUI = ({
  item,
  isSelected,
  onToggleSelect,
  isDragging = false,
  isOverlay = false,
  dragHandleProps = {},
}) => {
  const prio = COLOR_CONFIG.priority[item.priority] || COLOR_CONFIG.priority.Low;
  const PrioIcon = prio.icon;

  return (
    <div
      className={`group flex items-center border-b border-slate-50 dark:border-slate-800 min-w-250 md:min-w-full transition-shadow
        ${isDragging && !isOverlay
          ? "opacity-20 bg-slate-100 dark:bg-slate-800"
          : "bg-white dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30"
        }
        ${isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/50" : ""}
        ${isOverlay
          ? "shadow-2xl ring-2 ring-indigo-500 dark:ring-indigo-400 rounded-2xl cursor-grabbing"
          : ""
        }`}
    >
      <div className="flex-none w-10 flex items-center justify-center p-2">
        <div
          {...dragHandleProps}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg"
          title="Drag to reorder or change status"
        >
          <GripVertical size={18} />
        </div>
      </div>

      <div className="flex-none w-14 flex items-center justify-center p-2">
        <input
          type="checkbox"
          className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer bg-white dark:bg-slate-800"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(item.id);
          }}
        />
      </div>

      <div className="flex-none w-36 p-5 font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
        {item.id}
      </div>

      <div className="flex-1 p-5 min-w-75 overflow-hidden">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {item.subject}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
            <Briefcase size={10} />
            {item.project}
          </span>
        </div>
      </div>

      <div className="flex-none w-36 p-5">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl w-fit border ${prio.bg} ${prio.color} border-transparent`}
        >
          <PrioIcon size={12} />
          <span className="text-[10px] font-black tracking-tight">
            {item.priority}
          </span>
        </div>
      </div>

      <div className="flex-none w-48 p-5 overflow-hidden">
        <PreviewAssignees assignees={item.assignees} enable_tooltip={true} />
      </div>

      <div className="flex-none w-32 p-5 text-right">
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.date}</span>
          <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase mt-0.5 tracking-tighter">
            Deadline
          </span>
        </div>
      </div>

      <div className="flex-none w-16 p-5 flex items-center justify-center">
        <button className="text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 p-2">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
};

// --- Draggable Wrapper ---

const DraggableRow = ({ item, isSelected, onToggleSelect }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  return (
    <div ref={setNodeRef}>
      <TaskRowUI
        item={item}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

// --- Droppable Section ---

const DroppableStatusSection = ({
  status,
  items,
  selectedIds,
  onToggleSelect,
  searchQuery,
  groupBy,
}) => {
  const [searchParams] = useSearchParams();
  const group_by = searchParams.get("group_by") || "";
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  if (items.length === 0 && searchQuery) return null;

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-300 min-h-25 flex flex-col border-l-4 ${isOver
          ? "bg-indigo-50/50 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 shadow-inner"
          : "border-transparent"
        }`}
    >
      <div
        className={`sticky top-0 z-10 backdrop-blur-md border-y border-slate-100/50 dark:border-slate-800/50 py-3 px-6 flex items-center justify-between ${isOver ? "bg-indigo-100/60 dark:bg-indigo-900/60" : "bg-slate-50/80 dark:bg-slate-900/80"
          }`}
      >
        <div className="flex items-center gap-3">
          <Badge
            className={`${COLOR_CONFIG[group_by]?.[status]?.color || ''} ${COLOR_CONFIG[group_by]?.[status]?.bg || ''} border-none shadow-sm`}
          >
            {status}
          </Badge>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
            {items.length} {items.length === 1 ? "Task" : "Tasks"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isOver && (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full animate-pulse shadow-lg ring-2 ring-white/20">
              <span className="text-[9px] font-black uppercase tracking-widest">
                Move Here
              </span>
            </div>
          )}
          <ChevronDown size={16} className="text-slate-300 dark:text-slate-600" />
        </div>
      </div>

      <div className="flex flex-col">
        {items.length > 0 ? (
          items.map((item) => (
            <DraggableRow
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        ) : (
          <div className="p-8 flex justify-center bg-white/40 dark:bg-slate-900/40">
            <div
              className={`w-full max-w-sm py-8 border-2 border-dashed rounded-4xl transition-all flex flex-col items-center gap-2 ${isOver
                  ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/50"
                  : "border-slate-100 dark:border-slate-800 bg-transparent"
                }`}
            >
              <Activity size={24} className="text-slate-100 dark:text-slate-800" />
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                {isOver ? "Drop to Assign" : `Section Empty`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function ListView() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(null);
  const schema_query = useDoctypeSchema("Task");
  const qp = useQueryParams();

  const statusFilter = qp.getArray("status");
  const priorityFilter = qp.getArray("priority");
  const searchQuery = (qp.get("search") || "").toLowerCase();

  const group_by = searchParams.get("group_by") || null;
  const tasks_list_query = useTasksQuery();

  const schema = schema_query.data || {};
  const fields = schema.fields || [];

  const group_by_fields = useMemo(() => {
    return fields.filter((f) => f.fieldtype === "Select");
  }, [fields]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  const selectedGroupByField = useMemo(() => {
    return group_by_fields.find((f) => f.fieldname === group_by) || {};
  }, [group_by, group_by_fields]);

  const groups = useMemo(() => {
    if (selectedGroupByField.fieldtype === "Select") {
      return selectedGroupByField.options?.split("\n").map((opt) => opt.trim()) || [];
    }
    return [];
  }, [selectedGroupByField]);

  const items = tasks_list_query.data || [];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter.length && !statusFilter.includes(item.status)) {
        return false;
      }
      if (priorityFilter.length && !priorityFilter.includes(item.priority)) {
        return false;
      }
      if (searchQuery) {
        const haystack = `${item.subject || ""} ${item.id || ""}`.toLowerCase();
        if (!haystack.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, priorityFilter, searchQuery]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && groups.includes(over.id)) {
      // Handle status update logic here
    }
    setActiveId(null);
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const activeTask = useMemo(
    () => items.find((t) => t.id === activeId),
    [items, activeId]
  );

  if (tasks_list_query.isLoading || schema_query.isLoading) return "Loading...";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Card className="p-0">
        <Select
          variant="underlined"
          placeholder="Group by"
          value={group_by}
          options={group_by_fields.map((field) => ({
            value: field.fieldname,
            label: field.label || field.name,
          }))}
          style={{ width: "200px" }}
          onChange={(value) => {
            searchParams.set("group_by", value);
            setSearchParams(searchParams);
          }}
        />

        {!group_by ? (
          <div className="text-slate-600 dark:text-slate-400">Please select a 'Group by' field to display the list.</div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <div className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center min-w-250 md:min-w-full font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] py-4">
                <div className="w-10 flex justify-center">
                  <GripVertical size={14} />
                </div>
                <div className="w-14 flex justify-center">
                  <CheckSquare size={16} />
                </div>
                <div className="w-36 px-5">ID / Ref</div>
                <div className="flex-1 px-5 min-w-75">Subject & Context</div>
                <div className="w-36 px-5">Priority</div>
                <div className="w-48 px-5">Assignee</div>
                <div className="w-32 px-5 text-right">Deadline</div>
                <div className="w-16 px-5"></div>
              </div>

              <div className="flex flex-col min-h-150">
                {groups.map((group) => (
                  <DroppableStatusSection
                    key={group}
                    status={group}
                    items={filteredItems.filter((item) => item[group_by] === group)}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    searchQuery={searchQuery}
                    groupBy={group_by}
                  />
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="w-250 opacity-95">
                  <TaskRowUI
                    item={activeTask}
                    isSelected={selectedIds.includes(activeTask.id)}
                    isOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>

            {selectedIds.length > 0 && (
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white rounded-[40px] p-4 flex items-center gap-10 shadow-2xl z-50 ring-2 ring-white/10 dark:ring-white/5 pr-8">
                <div className="px-10 border-r border-white/10 flex flex-col">
                  <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
                    Bulk Manager
                  </span>
                  <span className="text-2xl font-black tracking-tighter">
                    {selectedIds.length}{" "}
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase italic tracking-normal">
                      Tasks
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-3 px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                    <UserPlus size={18} />
                    Assign
                  </button>
                  <button className="flex items-center gap-3 px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-emerald-400 dark:text-emerald-300">
                    <Check size={18} />
                    Complete
                  </button>
                  <button
                    className="flex items-center gap-3 px-6 py-3.5 bg-rose-500/10 hover:bg-rose-500 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 hover:text-white transition-all"
                    onClick={() => setSelectedIds([])}
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => setSelectedIds([])}
                  className="p-2 hover:bg-white/10 text-slate-500 dark:text-slate-400 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </DndContext>
  );
}
