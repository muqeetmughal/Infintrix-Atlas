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
import {
  useFrappeCreateDoc,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import { useGetDoctypeField } from "../hooks/doctype";
import { useParams, useSearchParams } from "react-router-dom";
import { message, Tooltip } from "antd";
import { IconRenderer } from "../components/IconRenderer";
import WorkItemTypeWidget from "../components/widgets/WorkItemTypeWidget";
import PreviewAssignees from "../components/PreviewAssignees";

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
            <Tooltip title={issue.type}>
              <WorkItemTypeWidget
                value={issue?.type || "Task"}
                disabled
                show_label={false}
              />
            </Tooltip>
            <span className="text-[11px] text-slate-500 font-bold tracking-tight uppercase">
              {issue.id}
            </span>
          </div>
          <div
            className={`w-7 h-7 rounded-full ${issue.assigneeColor} text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm`}
          >
            <PreviewAssignees
              assignees={issue.assignees}
              enable_tooltip={false}
            />
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

const Column = ({ id, title, tasks_list, createTask }) => {
  const [addNew, setAddNew] = useState(false);
  const { project } = useParams();
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
            {tasks_list.length}
          </span>
        </h3>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[150px]">
        <SortableContext
          items={tasks_list.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks_list.map((issue) => (
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
                        const newTaskItem = {
                          ...createItem,
                          subject: e.target.value,
                          project: project,
                        };
                        console.log("Creating work item:", newTaskItem);
                        createTask(newTaskItem);
                        // .then((res) => {
                        //   console.log("Created work item:", res);
                        //   setCreateItem({ subject: "", status: id });
                        //   setAddNew(false);
                        // })
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
            Create
          </button>
        )}
      </div>
    </div>
  );
};

export default function KanbanView() {
  const [activeIssue, setActiveIssue] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { project } = useParams();
  const createMutation = useFrappeCreateDoc();

  const updateTaskMutation = useFrappeUpdateDoc();
  const project_query = useFrappeGetDoc("Project", project);
  const columns_query = useGetDoctypeField("Task", "status", "options");

  const active_cycle_query = useFrappeGetDocList("Cycle", {
    filters: { project: project, status: "Active" },
  });
  const cycle_name = (active_cycle_query?.data || [])[0]?.name;

  const project_data = project_query.data || {};
  const isScrum = project_data.custom_execution_mode === "Scrum";

  // const tasks_list_query = useFrappeGetCall(
  //   `infintrix_atlas.api.v1.get_tasks?project=${project}&cycle=${cycle_name}`,
  //   {},
  //   ["tasks", "kanban", project, cycle_name],
  //   {
  //     isPaused: () => {
  //       if (isScrum){
  //         return !cycle_name;
  //       }
  //       return !project;
  //     },
  //   }
  // );
  const tasks_list_query = useFrappeGetDocList(
    `Task`,
    {
      filters: isScrum
        ? { project: project, custom_cycle: cycle_name }
        : { project: project },
      fields: [
        "name",
        "name as id",
        "subject as title",
        "status",
        "type",
        "custom_cycle as cycle",
        "priority",
        "modified",
        "project",
      ],
      // limit_page_length: 1000,
    },
    ["tasks", "kanban", project, cycle_name],
    {
      isPaused: () => {
        if (isScrum){
          return !cycle_name;
        }
        return !project;
      },
    }
  );

  const { options } = columns_query.data || [];

  const tasks_list = tasks_list_query.data || [];

  const COLUMNS = useMemo(() => {
    if (!options) {
      return [];
    } else {
      return options.map((option) => ({
        id: option,
        title: option,
      }));
    }
  }, [options]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findIssue = useCallback(
    (id) => tasks_list.find((i) => i.id === id),
    [tasks_list]
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveIssue(findIssue(active.id));
  };
  const handleDragOver = (event) => {
    const { active } = event;
    if (!active) return;

    // If already set, do nothing
    if (activeIssue && activeIssue.id === active.id) return;

    const task = tasks_list.find((t) => t.id === active.id);
    if (!task) return;

    setActiveIssue(task);
  };

  const mutateTaskStatus = async (task, newStatus) => {
    await tasks_list_query.mutate(
      async (current) => {
        await updateTaskMutation.updateDoc("Task", task, {
          status: newStatus,
        });

        return current.map((t) =>{
    
          if (t.name === task){
            return { ...t, status: newStatus };
          }
          return t;
        });
      },
      {
        optimisticData: (current) => {
          return current.map((t) => {
            if (t.name === task) {
              return { ...t, status: newStatus };
            }
            return t;
          });
        },
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      }
    );
  };

  const createNewTask = async (newTask) => {
    await tasks_list_query.mutate(
      async (current) => {
        const newTaskCreated = await createMutation.createDoc("Task", newTask);

        return [
          ...current,
          {
            ...newTaskCreated,
            id: newTaskCreated.name,
            title: newTaskCreated.subject,
          },
        ];
      },
      {
        optimisticData: (current) => {
          console.log("Optimistic current", current);
          return [
            ...current,
            {
              ...newTask,
              title: newTask.subject,

              id: "temp-" + Math.random().toString(36).substr(2, 9),
            },
          ];
        },
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      }
    );
  };
  // console.log("Tasks:", tasks_list_query);

  const handleDragEnd = async (event) => {
    setActiveIssue(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // console.log("Drag ended:", activeId, overId);

    const activeTask = tasks_list.find((i) => i.id === activeId);
    console.log("Active task:", activeTask);
    if (!activeTask) return;

    let newStatus = activeTask.status;
    // console.log("Current status:", newStatus);

    // Dropped on column
    if (COLUMNS.some((c) => c.id === overId)) {
      newStatus = overId;
    }

    // console.log("Updating status to:", newStatus);

    // Dropped on another task
    const overTask = tasks_list.find((i) => i.id === overId);
    if (overTask) {
      newStatus = overTask.status;
    }

    // console.log("Final new status:", newStatus);

    if (newStatus !== activeTask.status) {
      try {
        await mutateTaskStatus(activeId, newStatus);
        message.success("Task updated");
      } catch (e) {
        // console.error("Failed to update task", e);
        message.error(String(e.exception).split(":").slice(-1)[0]);
      }
    }
    // setActiveIssue(null);
    // const { active, over } = event;
    // if (!over) return;

    // const activeId = active.id;
    // const overId = over.id;

    // if (activeId !== overId) {
    //   console.log("activeId!=overId", activeId, overId);
    //   // setIssues((prev) => {
    //     // console.log("Prev issues:", prev);
    //     const activeIndex = prev.findIndex((i) => i.id === activeId);
    //     const overIndex = prev.findIndex((i) => i.id === overId);

    //     console.log("Active index:", activeIndex, "Over index:", overIndex);
    //     // return arrayMove(prev, activeIndex, overIndex);
    //   // });
    // }

    // const columnName = tasks_list.find((i) => i.id === activeId)?.status || overId;

    // console.log("Mutating status", activeId, columnName);

    // mutate(activeId, columnName);
    //  tasks_list_query.mutate()
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

  if (
    tasks_list_query.isLoading &&
    columns_query.isLoading &&
    project_query.isLoading &&
    active_cycle_query.isLoading
  ) {
    return <div>Loading...</div>;
  }
  return (
    <div className="text-slate-900">
      <div className="mx-auto flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-180px)] items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              tasks_list={tasks_list.filter((i) => i.status === col.id)}
              createTask={createNewTask}
            />
          ))}

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
