import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, MoreHorizontal, Ellipsis, Check } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  pointerWithin,
  rectIntersection,
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
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
  useFrappePostCall,
  useSWRConfig,
} from "frappe-react-sdk";
import { useGetDoctypeField } from "../hooks/doctype";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Dropdown, message, Tooltip } from "antd";
import WorkItemTypeWidget from "../components/widgets/WorkItemTypeWidget";
import { useAssigneeUpdateMutation, useTasksQuery } from "../hooks/query";
import { useQueryParams } from "../hooks/useQueryParams";
import SubjectWidget from "../components/widgets/SubjectWidget";
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS } from "../data/constants";
import PriorityWidget from "../components/widgets/PriorityWidget";
import { UsersSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import TaskActions from "../components/TaskActions";

const IssueCard = React.memo(
  React.forwardRef(
    (
      { issue, isDragging, isOverlay, listeners, attributes, style, ...props },
      ref,
    ) => {
      const [searchParams, setSearchParams] = useSearchParams();
      const [editingSubject, setEditingSubject] = useState(false);
      const updateMutation = useFrappeUpdateDoc();
      const assignee_update_mutation = useAssigneeUpdateMutation();

      return (
        <div
          ref={ref}
          style={style}
          className={`
      group bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm mb-3 select-none transition-shadow
      ${
        isDragging
          ? "opacity-40 border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"
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
          <span
            onClick={(e) => {
              if (issue.id === "new_item") return;
              searchParams.set("selected_task", issue.id);
              setSearchParams(searchParams);
            }}
            className="cursor-pointer text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase"
          >
            {issue.id}
          </span>
          <div className="flex items-start justify-between mb-1">
            <SubjectWidget task={issue} />

            {issue.id !== "new_item" && <TaskActions task={issue} />}
          </div>

          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-2">
              <Tooltip title={issue.type}>
                <WorkItemTypeWidget
                  show_label={true}
                  value={issue?.type || "Task"}
                  onChange={(newType) => {
                    updateMutation
                      .updateDoc("Task", issue.name, {
                        type: newType,
                      })
                      .then(() => {
                        // task_details_query.mutate();
                      });
                  }}
                />
              </Tooltip>
              <PriorityWidget
                value={issue.priority}
                onChange={(newPriority, e) => {
                  e?.stopPropagation?.();

                  updateMutation
                    .updateDoc("Task", issue.name, {
                      priority: newPriority,
                    })
                    .then(() => {});
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              {issue.status === "Completed" && (
                <Tooltip title={"Done"}>
                  <Check size={14} className="text-green-500" />
                </Tooltip>
              )}

              <div
                className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm`}
              >
                <UsersSelectWidget
                  mode="assignee"
                  show_label={false}
                  value={issue.assignee}
                  onSelect={(key) => {
                    assignee_update_mutation.call({
                      task_name: issue.name,
                      new_assignee: key,
                    });
                  }}
                />

                {/* <PreviewAssignees
              assignees={issue.assignees}
              enable_tooltip={false}
            /> */}
              </div>
            </div>
          </div>
        </div>
      );
    },
  ),
);

const SortableIssue = React.memo(({ issue }) => {
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
});

const Column = React.memo(({ id, title, tasks_list, createTask }) => {
  const [addNew, setAddNew] = useState(false);
  const qp = useQueryParams();
  const project = qp.get("project") || null;
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

  const taskIds = useMemo(() => tasks_list.map((t) => t.id), [tasks_list]);

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
      className="flex flex-col min-w-80 bg-slate-100/80 dark:bg-slate-800 rounded-xl p-3 border border-slate-200/50 dark:border-slate-700 h-full min-h-100"
    >
      <div className="sticky top-0 z-9 bg-slate-100/80 dark:bg-slate-800 flex items-center justify-between px-1 pb-3">
        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
          <div>
            <div className="flex justify-start items-center">
              <span>
                {React.createElement(TASK_STATUS_ICONS[title], {
                  size: 18,
                  className: `text-${TASK_STATUS_COLORS[title]}-600 mr-1`,
                })}
              </span>
              <span className={`text-${TASK_STATUS_COLORS[title]}-600`}>
                {title}
              </span>
            </div>
          </div>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
            {tasks_list.length}
          </span>
        </h3>
        <button
          onClick={() => {
            setAddNew(true);
          }}
          className="text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {addNew && (
          <div data-create-item>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <input
                type="text"
                className="w-full border-0 bg-transparent focus:ring-0 p-0 m-0 outline-none text-sm font-medium text-slate-800 dark:text-slate-100"
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
                    createTask(newTaskItem);
                    setCreateItem({ subject: "", status: id });
                    setAddNew(false);
                  } else if (e.key === "Escape") {
                    setCreateItem({ subject: "", status: id });
                    setAddNew(false);
                  }
                }}
                autoFocus
              />
            </div>
          </div>
        )}

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks_list.map((issue) => (
            <SortableIssue key={issue.id} issue={issue} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
});

export default function KanbanView() {
  const [activeIssue, setActiveIssue] = useState(null);
  const { mutate } = useSWRConfig();
  // const { project } = useParams();
  const qp = useQueryParams();
  const project = qp.get("project") || null;
  const statusFilter = qp.getArray("status");
  const priorityFilter = qp.getArray("priority");
  const searchText = (qp.get("search") || "").toLowerCase();
  const createMutation = useFrappeCreateDoc();

  const updateTaskMutation = useFrappeUpdateDoc();
  const updateSortOrderMutation = useFrappePostCall(
    "infintrix_atlas.api.v1.update_task_sort_order",
  );
  const notifyStatusChange = useFrappePostCall(
    "infintrix_atlas.api.v1.notify_status_changed",
  );
  const project_query = useFrappeGetDoc("Project", project);
  const columns_query = useGetDoctypeField("Task", "status", "options");

  const active_cycle_query = useFrappeGetDocList("Cycle", {
    filters: { project: project, status: "Active" },
  });
  const cycle = (active_cycle_query?.data || [])[0];
  const cycle_name = cycle?.name;

  const project_data = project_query.data || {};
  const isScrum = project_data.custom_execution_mode === "Scrum";

  const tasks_list_query = useTasksQuery(project);
  const { options } = columns_query.data || [];

  const tasks_list = useMemo(() => {
    return tasks_list_query?.data?.message || [];
  }, [tasks_list_query?.data?.message]);

  const COLUMNS = useMemo(() => {
    if (!options) {
      return [];
    } else {
      return options
        .filter((option) => option.toLowerCase() !== "template")
        .map((option) => ({
          id: option,
          title: option,
        }));
    }
  }, [options]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { tasksById, tasksByStatus } = useMemo(() => {
    const tasks = tasks_list || [];

    const byId = {};
    const byStatus = {};

    for (const task of tasks) {
      byId[task.id] = task;

      if (!byStatus[task.status]) {
        byStatus[task.status] = [];
      }

      byStatus[task.status].push(task.id);
    }

    return {
      tasksById: byId,
      tasksByStatus: byStatus,
    };
  }, [tasks_list]);
  const findIssue = useCallback((id) => tasksById[id], [tasksById]);

  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;
      setActiveIssue(findIssue(active.id));
    },
    [findIssue],
  );
  const handleDragOver = useCallback(
    (event) => {
      const { active } = event;
      if (!active) return;

      // If already set, do nothing
      if (activeIssue && activeIssue.id === active.id) return;

      const task = tasksById[active.id];
      if (!task) return;

      setActiveIssue(task);
    },
    [activeIssue, tasksById],
  );

  const mutateTaskStatus = useCallback(async (task, newStatus) => {
    // Find the current task to get old status
    const currentTask = tasks_list.find((t) => t.name === task);
    const oldStatus = currentTask?.status;

    await tasks_list_query
      .mutate(
        async (current) => {
          await updateTaskMutation.updateDoc("Task", task, {
            status: newStatus,
          });

          return (current || []).map((t) => {
            if (t.name === task) {
              return { ...t, status: newStatus };
            }
            return t;
          });
        },
        {
          optimisticData: (current) => {
            return (current || []).map((t) => {
              if (t.name === task) {
                return { ...t, status: newStatus };
              }
              return t;
            });
          },
          rollbackOnError: true,
          revalidate: false,
          populateCache: true,
        },
      )
      .then(() => {
        mutate(["Project", project]);
      
      });
  });

  const createNewTask = useCallback(async (newTask) => {
    await tasks_list_query.mutate(
      async (current) => {
        const newTaskCreated = await createMutation.createDoc("Task", newTask);
        return {
          ...current,
          message: [
            ...(current?.message || []),
            {
              ...newTaskCreated,
              id: newTaskCreated.name,
              title: newTaskCreated.subject,
            },
          ],
        };

        // return [
        //   ...current,
        //   {
        //     ...newTaskCreated,
        //     id: newTaskCreated.name,
        //     title: newTaskCreated.subject,
        //   },
        // ];
      },
      {
        optimisticData: (current) => {
          const tempId = "temp-" + Math.random().toString(36).substr(2, 9);
          const newTaskOptimistic = {
            ...newTask,
            id: tempId,
            title: newTask.subject,
          };
          return {
            ...current,
            message: [...(current?.message || []), newTaskOptimistic],
          };
          // return [
          //   ...current,
          //   {
          //     ...newTask,
          //     title: newTask.subject,

          //     id: "temp-" + Math.random().toString(36).substr(2, 9),
          //   },
          // ];
        },
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      },
    );
  });

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasksById[activeId];
    if (!activeTask) return;

    // If dropped back onto itself, do nothing
    if (activeId === overId) {
      setActiveIssue(null);
      return;
    }

    let newStatus = activeTask.status;
    const oldStatus = activeTask.status;

    // Dropped on column
    if (COLUMNS.some((c) => c.id === overId)) {
      newStatus = overId;
    }

    // Dropped on another task
    const overTask = tasksById[overId];
    if (overTask) {
      newStatus = overTask.status;
    }

    try {
      await tasks_list_query.mutate(
        async (current) => {
          const next = (current?.message || []).map((t) =>
            t.id === activeId ? { ...t, status: newStatus } : t,
          );

          if (newStatus !== oldStatus) {
            await updateTaskMutation.updateDoc("Task", activeTask.name, {
              status: newStatus,
            });
            mutate(["Project", project]);
          
          }

          return {
            ...current,
            message: next,
          };
        },
        {
          optimisticData: (current) => {
            return {
              ...current,
              message: (current?.message || []).map((t) =>
                t.id === activeId ? { ...t, status: newStatus } : t,
              ),
            };
          },
          rollbackOnError: true,
          revalidate: false,
          populateCache: true,
        },
      );
    } catch (e) {
      console.error("Failed to update task status:", e);
      if (newStatus !== oldStatus) {
        message.error(
          String(e.exception || e.message || e)
            .split(":")
            .slice(-1)[0],
        );
      }
    } finally {
      setActiveIssue(null);
    }
  });

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  const getSortedTasks = useCallback(
    (status) => {
      const ids = tasksByStatus[status] || [];

      return ids
        .map((id) => tasksById[id])
        .slice()
        .sort((a, b) => {
          const aSort = a.custom_sort_order ?? Number.POSITIVE_INFINITY;

          const bSort = b.custom_sort_order ?? Number.POSITIVE_INFINITY;

          if (aSort !== bSort) return aSort - bSort;

          return String(b.modified || "").localeCompare(
            String(a.modified || ""),
          );
        });
    },
    [tasksByStatus, tasksById],
  );

  const collisionDetectionStrategy = (args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    return rectIntersection(args);
  };

  if (
    tasks_list_query.isLoading &&
    columns_query.isLoading &&
    project_query.isLoading &&
    active_cycle_query.isLoading &&
    (!isScrum || (isScrum && !cycle_name))
  ) {
    return <div>Loading...</div>;
  }

  if (isScrum && !cycle_name) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-35 h-35 bg-blue-50 rounded-full flex items-center justify-center">
              <img
                src="/images/agile.svg"
                alt="No cycle"
                className="w-25 h-25"
              />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 mb-2">
              No Active Sprint
            </p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Create or select an active sprint to start organizing your tasks
            </p>
          </div>
          <Link
            to={`/tasks/backlog?project=${project}`}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Go to Backlog
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="text-slate-900 h-[calc(100vh-180px)] overflow-hidden">
      <div className="mx-auto flex gap-6 overflow-x-auto hide-scrollbar pb-8 h-full items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((col) => {
            const columnTasks = getSortedTasks(col.id);

            return (
              <Column
                key={col.id}
                id={col.id}
                title={col.title}
                tasks_list={columnTasks}
                createTask={createNewTask}
              />
            );
          })}

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
