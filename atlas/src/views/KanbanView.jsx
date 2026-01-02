import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";
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
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import { useGetDoctypeField } from "../hooks/doctype";
import { useSearchParams } from "react-router-dom";

const IssueCard = React.forwardRef(
  (
    { issue, isDragging, isOverlay, listeners, attributes, style, ...props },
    ref
  ) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const handleTitleClick = (e) => {
      e.stopPropagation();
      if (issue.id === "new_item") return;
      console.log("Issue clicked:", issue, issue);
      searchParams.set("selected_task", issue.id);
      setSearchParams(searchParams);
    };

    return (
      <div
        ref={ref}
        style={style}
        className={`
        group bg-white p-4 rounded-lg border shadow-sm mb-3 select-none transition-shadow
        ${
          isDragging
            ? "opacity-40 border-blue-400 ring-2 ring-blue-100"
            : "border-slate-200 hover:border-slate-300 hover:shadow-md"
        }
        ${
          isOverlay
            ? "shadow-xl cursor-grabbing ring-2 ring-blue-500 border-blue-500 scale-105 transition-transform"
            : "cursor-grab"
        }
      `}
        {...attributes}
        {...listeners}
        {...props}
      >
        <div className="flex items-start justify-between mb-2">
          <p
            onClick={handleTitleClick}
            className="text-sm font-medium text-slate-800 leading-snug cursor-pointer hover:text-blue-600"
          >
            {issue.title}
          </p>
          {issue.id !== "new_item" && (
            <div
              className="text-slate-300 group-hover:text-slate-500 transition-colors p-1 -mr-2"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={16} />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-sm ${
                issue.type === "story" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] text-slate-500 font-bold tracking-tight uppercase">
              {issue.id}
            </span>
          </div>
          <div
            className={`w-7 h-7 rounded-full ${issue.assigneeColor} text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm`}
          >
            {issue.assigneeInitials}
          </div>
        </div>
      </div>
    );
  }
);

const SortableIssue = ({ issue }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: "Issue",
      issue,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <IssueCard
      ref={setNodeRef}
      issue={issue}
      isDragging={isDragging}
      style={style}
      attributes={attributes}
      listeners={listeners}
    />
  );
};

const Column = ({ id, title, issues }) => {
  const [addNew, setAddNew] = useState(false);
  const [createItem, setCreateItem] = useState({
    subject: "",
    status: id,
  });
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
    },
  });

  const handleClickOutside = useCallback(() => {
    setCreateItem({ subject: "", status: id });
    setAddNew(false);
  }, [id]);

  useEffect(() => {
    if (!addNew) return;

    const handleMouseDown = (e) => {
      const target = e.target.closest("[data-create-item]");
      if (!target) {
        handleClickOutside();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [addNew, handleClickOutside]);

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-80 bg-slate-100/80 rounded-xl p-3 max-h-full border border-slate-200/50"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
          {title}
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
            {issues.length}
          </span>
        </h3>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[150px]">
        <SortableContext
          items={issues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <SortableIssue key={issue.id} issue={issue} />
          ))}
        </SortableContext>

        {addNew ? (
          <div data-create-item>
            <IssueCard
              issue={{
                title: (
                  <input
                    type="text"
                    className="w-full border-0 bg-transparent focus:ring-0 p-0 m-0 outline-none"
                    placeholder="Enter work item title"
                    value={createItem.subject}
                    onChange={(e) =>
                      setCreateItem({ ...createItem, subject: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        console.log("Creating work item:", createItem);
                        setCreateItem({ subject: "", status: id });
                        setAddNew(false);
                      } else if (e.key === "Escape") {
                        setCreateItem({ subject: "", status: id });
                        setAddNew(false);
                      }
                    }}
                    autoFocus
                  />
                ),
                id: "new_item",
                assigneeInitials: "",
                assigneeColor: "bg-slate-400",
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => {
              setAddNew(true);
            }}
            className="cursor-pointer w-full mt-2 py-2 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-200/50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create Work Item
          </button>
        )}
      </div>
    </div>
  );
};

export default function KanbanView({ tasks = [] }) {
  const [issues, setIssues] = useState(tasks);

  const updateTaskMutation = useFrappeUpdateDoc();

  const columns_query = useGetDoctypeField("Task", "status", "options");
  const [activeIssue, setActiveIssue] = useState(null);
  const columnOptions = columns_query.data || [];

  const COLUMNS =
    columnOptions.length > 0
      ? columnOptions.map((option) => ({
          id: option,
          title: option,
        }))
      : [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Find issue by ID
  const findIssue = useCallback(
    (id) => issues.find((i) => i.id === id),
    [issues]
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveIssue(findIssue(active.id));
  };

  /**
   * onDragOver handles the real-time movement between columns
   */
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAnIssue = active.data.current?.type === "Issue";
    const isOverAnIssue = over.data.current?.type === "Issue";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isActiveAnIssue) return;

    // 1. Dragging an Issue over another Issue
    if (isActiveAnIssue && isOverAnIssue) {
      setIssues((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        const overIndex = prev.findIndex((i) => i.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          const updatedIssues = [...prev];
          updatedIssues[activeIndex] = {
            ...updatedIssues[activeIndex],
            status: updatedIssues[overIndex].status,
          };
          return arrayMove(updatedIssues, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // 2. Dragging an Issue over an empty Column
    if (isActiveAnIssue && isOverAColumn) {
      setIssues((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        const updatedIssues = [...prev];
        updatedIssues[activeIndex] = {
          ...updatedIssues[activeIndex],
          status: overId,
        };
        return arrayMove(updatedIssues, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event) => {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
      setIssues((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        const overIndex = prev.findIndex((i) => i.id === overId);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    const columnName = issues.find((i) => i.id === activeId)?.status || overId;

    console.log("Mutating status", activeId, columnName);

    mutate(activeId, columnName);
  };
  const mutate = async (taskName, newStatus) => {
    try {
      await updateTaskMutation.updateDoc("Task", taskName, {
        status: newStatus,
      });

      console.log("Status updated:", newStatus);
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <div className="text-slate-900">
      <div className="mx-auto flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-180px)] items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              issues={issues.filter((i) => i.status === col.id)}
            />
          ))}

          {/* This is the secret to smoothness: The Overlay follows the mouse */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeIssue ? (
              <IssueCard issue={activeIssue} isOverlay={true} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
