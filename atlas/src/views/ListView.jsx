import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
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
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Calendar,
  CheckSquare,
  Plus,
  UserPlus,
  Trash2,
  Download,
  LayoutList,
  ArrowUpDown,
  Check,
  X,
  Briefcase,
  AlertCircle,
  Hash,
  Settings,
  ChevronDown,
  GripVertical,
  RotateCcw,
  Activity,
  Tag,
} from "lucide-react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useParams, useSearchParams } from "react-router-dom";
import { Select } from "antd";
import { useDoctypeSchema, useGetDoctypeField } from "../hooks/doctype";
import Card from "../components/ui/Card";

// --- Constants ---

const STATUS_CONFIG = {
  Backlog: "bg-slate-100 text-slate-600 border-slate-200",
  Open: "bg-blue-50 text-blue-600 border-blue-100",
  Working: "bg-amber-50 text-amber-700 border-amber-100",
  "Pending Review": "bg-purple-50 text-purple-700 border-purple-100",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const PRIORITY_CONFIG = {
  Urgent: { color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
  High: { color: "text-orange-600", bg: "bg-orange-50", icon: AlertCircle },
  Medium: { color: "text-indigo-600", bg: "bg-indigo-50", icon: Hash },
  Low: { color: "text-slate-400", bg: "bg-slate-50", icon: Hash },
};

const COLOR_CONFIG = {
  status: {
    Backlog: { color: "text-slate-600", bg: "bg-slate-100" },
    Open: { color: "text-blue-600", bg: "bg-blue-50" },
    Working: { color: "text-amber-700", bg: "bg-amber-50" },
    "Pending Review": { color: "text-purple-700", bg: "bg-purple-50" },
    Completed: { color: "text-emerald-700", bg: "bg-emerald-50" },
  },
  priority: {
    Urgent: { color: "text-red-600", bg: "bg-red-100", icon: AlertCircle },
    High: { color: "text-orange-600", bg: "bg-orange-100", icon: AlertCircle },
    Medium: { color: "text-indigo-600", bg: "bg-indigo-100", icon: Hash },
    Low: { color: "text-slate-400", bg: "bg-green-100", icon: Hash },
  },
};
const INITIAL_DATA = [
  {
    id: "TASK-2024-001",
    subject: "Integrate Stripe API for Subscriptions",
    project: "PROJ-001",
    status: "Working",
    priority: "Urgent",
    assignee: "Alex Rivera",
    date: "2024-05-12",
  },
  {
    id: "TASK-2024-002",
    subject: "Fix Header Alignment on Mobile",
    project: "PROJ-001",
    status: "Pending Review",
    priority: "Medium",
    assignee: "Sarah Chen",
    date: "2024-05-14",
  },
  {
    id: "TASK-2024-003",
    subject: "Draft Project Charter",
    project: "PROJ-002",
    status: "Open",
    priority: "High",
    assignee: "John Doe",
    date: "2024-05-15",
  },
  {
    id: "TASK-2024-004",
    subject: "Setup Redis Cache Layer",
    project: "PROJ-003",
    status: "Backlog",
    priority: "Urgent",
    assignee: "Unassigned",
    date: "2024-05-20",
  },
  {
    id: "TASK-2024-005",
    subject: "UI Consistency Audit",
    project: "PROJ-001",
    status: "Completed",
    priority: "Low",
    assignee: "Mike Ross",
    date: "2024-04-30",
  },
  {
    id: "TASK-2024-006",
    subject: "Legal Compliance Check",
    project: "PROJ-004",
    status: "Open",
    priority: "Medium",
    assignee: "Jane Smith",
    date: "2024-05-18",
  },
  {
    id: "TASK-2024-007",
    subject: "Refactor Auth Middleware",
    project: "PROJ-003",
    status: "Working",
    priority: "High",
    assignee: "Alex Rivera",
    date: "2024-05-22",
  },
  {
    id: "TASK-2024-008",
    subject: "Database Migration Script",
    project: "PROJ-003",
    status: "Cancelled",
    priority: "Urgent",
    assignee: "John Doe",
    date: "2024-05-25",
  },
];

// --- Sub-Components ---

const Badge = ({ children, className }) => (
  <span
    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border transition-all ${className}`}
  >
    {children}
  </span>
);

const Avatar = ({ name }) => (
  <div className="flex items-center gap-2 group cursor-pointer">
    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      {name?.charAt(0) || "?"}
    </div>
    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
      {name}
    </span>
  </div>
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
  const prio = PRIORITY_CONFIG[item.priority];
  const PrioIcon = prio.icon;

  return (
    <div
      className={`group flex items-center border-b border-slate-50 min-w-[1000px] md:min-w-full transition-shadow
        ${
          isDragging && !isOverlay
            ? "opacity-20 bg-slate-100"
            : "bg-white hover:bg-indigo-50/30"
        } 
        ${isSelected ? "bg-indigo-50/50" : ""} 
        ${
          isOverlay
            ? "shadow-2xl ring-2 ring-indigo-500 rounded-2xl cursor-grabbing"
            : ""
        }`}
    >
      {/* Moved Drag Handle to the start for better visibility */}
      <div className="flex-none w-10 flex items-center justify-center p-2">
        <div
          {...dragHandleProps}
          className="p-2 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing transition-all hover:bg-indigo-50 rounded-lg"
          title="Drag to reorder or change status"
        >
          <GripVertical size={18} />
        </div>
      </div>

      <div className="flex-none w-14 flex items-center justify-center p-2">
        <input
          type="checkbox"
          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(item.id);
          }}
        />
      </div>

      <div className="flex-none w-36 p-5 font-mono text-[11px] font-bold text-slate-400 uppercase tracking-tight">
        {item.id}
      </div>

      <div className="flex-1 p-5 min-w-[300px] overflow-hidden">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 truncate">
            {item.subject}
          </span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
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
        <Avatar name={item.assignee} />
      </div>

      <div className="flex-none w-32 p-5 text-right">
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-700">{item.date}</span>
          <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5 tracking-tighter">
            Deadline
          </span>
        </div>
      </div>

      <div className="flex-none w-16 p-5 flex items-center justify-center">
        <button className="text-slate-300 hover:text-slate-600 p-2">
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
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const group_by = searchParams.get("group_by") || "";
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  if (items.length === 0 && searchQuery) return null;

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-300 min-h-25 flex flex-col border-l-4 ${
        isOver
          ? "bg-indigo-50/50 border-indigo-500 shadow-inner"
          : "border-transparent"
      }`}
    >
      <div
        className={`sticky top-0 z-10 backdrop-blur-md border-y border-slate-100/50 py-3 px-6 flex items-center justify-between ${
          isOver ? "bg-indigo-100/60" : "bg-slate-50/80"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* <div
            className={`w-1 h-4 rounded-full ${STATUS_CONFIG[status]
              .split(" ")[1]
              .replace("text-", "bg-")}`}
          /> */}
          <Badge
            className={`${COLOR_CONFIG[group_by][status]?.color} ${COLOR_CONFIG[group_by][status]?.bg} border-none shadow-sm`}
          >
            {status}
          </Badge>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
            {items.length} {items.length === 1 ? "Task" : "Tasks"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isOver && (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full animate-pulse shadow-lg ring-2 ring-white/20">
              <span className="text-[9px] font-black uppercase tracking-widest">
                Move Here
              </span>
            </div>
          )}
          <ChevronDown size={16} className="text-slate-300" />
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
          <div className="p-8 flex justify-center bg-white/40">
            <div
              className={`w-full max-w-sm py-8 border-2 border-dashed rounded-4xl transition-all flex flex-col items-center gap-2 ${
                isOver
                  ? "border-indigo-400 bg-indigo-50/50"
                  : "border-slate-100 bg-transparent"
              }`}
            >
              <Activity size={24} className="text-slate-100" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
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
  const [items_old, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [filters, setFilters] = useState({ status: [], priority: [] });
  const params = useParams();

  const [searchParams, setSearchParams] = useSearchParams();
  const group_by = searchParams.get("group_by") || null;
  const project_id = params.project || "";
  //   const doctype_field_query = useGetDoctypeField("Task", group_by, "options");
  const tasks_query = useFrappeGetDocList("Task", {
    filters: { project: project_id },
    fields: [
      "name as id",
      "name",
      "subject",
      "custom_cycle as cycle",
      "type",
      "status",
      "project",
      "priority",
      "creation as date",
    ],
  });

  const items = tasks_query?.data || [];

  //   const { fieldtype, options, fieldname, label } =
  //     doctype_field_query.data || {};
  const schema_query = useDoctypeSchema("Task");

  //   const group_by_link_query = useFrappeGetDocList(
  //     queryField.doctype,
  //     {},
  //     "link_query_for_" + queryField.options,
  //     { isPaused: () => queryField.fieldtype !== "Link" }
  //   );

  //   console.log("group_by_link_query:", group_by_link_query);

  const schema = schema_query.data || {};
  const fields = schema.fields || [];

  const group_by_fields = useMemo(() => {
    return fields.filter(
      (f) => f.fieldtype === "Select"
      //   || f.fieldtype === "Link"
    );
  }, [fields]);

  const statuses = Object.keys(STATUS_CONFIG);

  console.log("statuses:", statuses);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  const selectedGroupByField = useMemo(() => {
    return group_by_fields.find((f) => f.fieldname === group_by) || {};
  }, [group_by]);

  const groups = useMemo(() => {
    if (selectedGroupByField.fieldtype === "Select") {
      return selectedGroupByField.options.split("\n").map((opt) => opt.trim());
    }
    return;
  }, [selectedGroupByField]);

  console.log("groups:", groups);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filters.status.length === 0 || filters.status.includes(item.status);
      const matchesPriority =
        filters.priority.length === 0 ||
        filters.priority.includes(item.priority);
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [items, searchQuery, filters]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && statuses.includes(over.id)) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === active.id ? { ...item, status: over.id } : item
        )
      );
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

  if (tasks_query.isLoading) return "Loading...";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Card className="p-0">
        {/* <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 p-4 md:p-8 space-y-6"> */}
        {/* Header */}

        {/* Search Toolbar */}

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
          "Please select a 'Group by' field to display the list."
        ) : (
          <>
            {/* List Content */}
            <div className="overflow-x-auto custom-scrollbar">
              {/* List Header */}
              <div className="bg-slate-50/80 border-b border-slate-100 flex items-center min-w-[1000px] md:min-w-full font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] py-4">
                <div className="w-10 flex justify-center">
                  <GripVertical size={14} />
                </div>
                <div className="w-14 flex justify-center">
                  <CheckSquare size={16} />
                </div>
                <div className="w-36 px-5">ID / Ref</div>
                <div className="flex-1 px-5 min-w-[300px]">
                  Subject & Context
                </div>
                <div className="w-36 px-5">Priority</div>
                <div className="w-48 px-5">Assignee</div>
                <div className="w-32 px-5 text-right">Deadline</div>
                <div className="w-16 px-5"></div>
              </div>

              <div className="flex flex-col min-h-[600px]">
                {groups.map((group) => (
                  <DroppableStatusSection
                    key={group}
                    status={group}
                    items={filteredItems.filter(
                      (item) => item[group_by] === group
                    )}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? (
                <div className="w-[1000px] opacity-95">
                  <TaskRowUI
                    item={activeTask}
                    isSelected={selectedIds.includes(activeTask.id)}
                    isOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>

            {/* Batch Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-[40px] p-4 flex items-center gap-10 shadow-2xl z-50 ring-2 ring-white/10 pr-8">
                <div className="px-10 border-r border-white/10 flex flex-col">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Bulk Manager
                  </span>
                  <span className="text-2xl font-black tracking-tighter">
                    {selectedIds.length}{" "}
                    <span className="text-sm text-slate-500 font-bold uppercase italic tracking-normal">
                      Tasks
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-3 px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                    <UserPlus size={18} />
                    Assign
                  </button>
                  <button className="flex items-center gap-3 px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-emerald-400">
                    <Check size={18} />
                    Complete
                  </button>
                  <button
                    className="flex items-center gap-3 px-6 py-3.5 bg-rose-500/10 hover:bg-rose-500 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:text-white transition-all"
                    onClick={() => {
                      setItems((prev) =>
                        prev.filter((i) => !selectedIds.includes(i.id))
                      );
                      setSelectedIds([]);
                    }}
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => setSelectedIds([])}
                  className="p-2 hover:bg-white/10 text-slate-500 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            )}
            {/* </div> */}
          </>
        )}
      </Card>
    </DndContext>
  );
}
