import {
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRef, useEffect } from "react";
import { AssigneeSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import { useSearchParams } from "react-router-dom";
import PriorityWidget from "./widgets/PriorityWidget";
const SubTasks = ({ task }) => {
  console.log("task in subtasks", task);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const task_detail_query = useFrappeGetDoc("Task", task);

  const subtasks_of_task_query = useFrappeGetDocList("Task", {
    filters: [["parent_task", "=", task]],
    fields: ["*"],
    order_by: "modified desc",
  });

  const createMutation = useFrappeCreateDoc();
  const updateMutation = useFrappeUpdateDoc();
  const parent_task = task_detail_query.data || {};
  const subtasks = subtasks_of_task_query.data || [];

  // const subtasks = [
  //   {
  //     name: "TASK-2026-00034",
  //     owner: "Administrator",
  //     creation: "2026-02-19 01:24:24.436523",
  //     modified: "2026-02-19 01:24:24.436523",
  //     modified_by: "Administrator",
  //     docstatus: 0,
  //     idx: 0,
  //     subject: "Task child A",
  //     project: null,
  //     custom_cycle: null,
  //     issue: null,
  //     type: "Task",
  //     color: null,
  //     is_group: 0,
  //     is_template: 0,
  //     status: "Open",
  //     priority: "Low",
  //     task_weight: 0,
  //     parent_task: "TASK-2026-00033",
  //     completed_by: null,
  //     completed_on: null,
  //     custom_sort_order: 0,
  //     exp_start_date: null,
  //     expected_time: 0,
  //     start: 0,
  //     exp_end_date: null,
  //     progress: 0,
  //     duration: 0,
  //     is_milestone: 0,
  //     description: null,
  //     depends_on_tasks: "",
  //     act_start_date: null,
  //     actual_time: 0,
  //     act_end_date: null,
  //     custom_story_points: 0,
  //     total_costing_amount: 0,
  //     total_expense_claim: 0,
  //     total_billing_amount: 0,
  //     review_date: null,
  //     closing_date: null,
  //     department: null,
  //     company: "Infintrix Technologies",
  //     custom_created_by_ai: 0,
  //     custom_ai_session: null,
  //     custom_ai_confidence: 0,
  //     custom_weight: 0,
  //     lft: 30,
  //     rgt: 31,
  //     old_parent: "TASK-2026-00033",
  //     template_task: null,
  //   },
  //   {
  //     name: "TASK-2026-00035",
  //     owner: "Administrator",
  //     creation: "2026-02-19 01:24:38.407951",
  //     modified: "2026-02-19 01:24:38.407951",
  //     modified_by: "Administrator",
  //     docstatus: 0,
  //     idx: 0,
  //     subject: "Task Child B",
  //     project: null,
  //     custom_cycle: null,
  //     issue: null,
  //     type: "Task",
  //     color: null,
  //     is_group: 0,
  //     is_template: 0,
  //     status: "Open",
  //     priority: "Low",
  //     task_weight: 0,
  //     parent_task: "TASK-2026-00033",
  //     completed_by: null,
  //     completed_on: null,
  //     custom_sort_order: 0,
  //     exp_start_date: null,
  //     expected_time: 0,
  //     start: 0,
  //     exp_end_date: null,
  //     progress: 0,
  //     duration: 0,
  //     is_milestone: 0,
  //     description: null,
  //     depends_on_tasks: "",
  //     act_start_date: null,
  //     actual_time: 0,
  //     act_end_date: null,
  //     custom_story_points: 0,
  //     total_costing_amount: 0,
  //     total_expense_claim: 0,
  //     total_billing_amount: 0,
  //     review_date: null,
  //     closing_date: null,
  //     department: null,
  //     company: "Infintrix Technologies",
  //     custom_created_by_ai: 0,
  //     custom_ai_session: null,
  //     custom_ai_confidence: 0,
  //     custom_weight: 0,
  //     lft: 32,
  //     rgt: 33,
  //     old_parent: "TASK-2026-00033",
  //     template_task: null,
  //   },
  // ];

  const handleAddTask = () => {
    setIsAdding(true);
    setInputValue("");
  };

  const setParentTaskIsGroup = () => {
    if (!parent_task.is_group) {
      updateMutation
        .updateDoc("Task", parent_task.name, { is_group: 1 })
        .then(() => {
          task_detail_query.refetch();
        });
    }
  };

  const createSubTask = () => {
    createMutation
      .createDoc("Task", {
        subject: inputValue.trim(),
        parent_task: task,
        status: "Open",
      })
      .then(() => {
        subtasks_of_task_query.mutate();
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      // Create task with parent task reference
      console.log("Creating subtask:", inputValue, "for parent:", task);
      // Add your API call here
      if (!parent_task.is_group) {
        updateMutation
          .updateDoc("Task", parent_task.name, { is_group: 1 })
          .then(() => {
            createSubTask();
            task_detail_query.refetch();
          });
      } else {
        createSubTask();
      }

      setIsAdding(false);
      setInputValue("");
    } else if (e.key === "Escape") {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        // Only close if input is empty
        if (inputValue.trim() === "") {
          setIsAdding(false);
        }
      }
    };

    if (isAdding) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAdding, inputValue]);

  return (
    <section>
      <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
        Subtasks
      </h3>

      <div className="space-y-2 mb-4">
        {subtasks.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-600">
                <th className="text-left px-2 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Name
                </th>
                <th className="text-left px-2 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Subject
                </th>
                <th className="text-left px-2 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Priority
                </th>
                <th className="text-left px-2 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Assignee
                </th>
                <th className="text-left px-2 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {subtasks.map((subtask) => (
                <tr
                  key={subtask.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-2 py-2 text-slate-900 dark:text-slate-100">
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => {
                        searchParams.set("selected_task", subtask.name);
                        setSearchParams(searchParams);
                      }}
                    >
                      {subtask.name}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-slate-900 dark:text-slate-100">
                    <span>{subtask.subject}</span>
                  </td>
                  <td className="px-2 py-2">
                    <PriorityWidget
                      value={subtask.priority}
                      onChange={(v) => {
                        createMutation
                          .updateDoc("Task", subtask.name, { priority: v })
                          .then(() => subtasks_of_task_query.mutate());
                      }}
                    />
                    {/* <span
                      className={`text-xs px-2 py-1 rounded ${subtask.priority === "High" ? "bg-red-100 text-red-700" : subtask.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                    >
                      {subtask.priority}
                    </span> */}
                  </td>
                  <td className="px-2 py-2 text-slate-600 dark:text-slate-400">
                    {console.log("subtask", subtask)}
                    <AssigneeSelectWidget
                      single={true}
                      show_label={true}
                      value={[subtask.assignee] || []}
                      task={subtask.name}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${subtask.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {subtask.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No subtasks yet
          </p>
        )}
      </div>
      <div className="flex flex-col space-y-2">
        {isAdding ? (
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter subtask name..."
            className="text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        ) : (
          <button
            onClick={handleAddTask}
            className="flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 -ml-2 rounded transition-colors"
          >
            <Plus size={16} className="mr-1" /> Add subtask
          </button>
        )}
      </div>
    </section>
  );
};

export default SubTasks;
