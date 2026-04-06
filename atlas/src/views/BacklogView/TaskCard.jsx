import { useDraggable } from "@dnd-kit/core";
import { useFrappeUpdateDoc, useSWRConfig } from "frappe-react-sdk";
import { GripVertical } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import WorkItemTypeWidget from "../../components/widgets/WorkItemTypeWidget";
import StatusWidget from "../../components/widgets/StatusWidget";

const TaskCard = ({ task, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });
  const updateMutation = useFrappeUpdateDoc();
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

export default TaskCard;
