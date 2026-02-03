import { useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRef, useEffect } from "react";
const SubTasks = ({ task }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);


  const subtasks_of_task_query = useFrappeGetDocList("Task", {
    filters: [["parent_task", "=", task]],
    fields: ["*"],
    order_by: "modified desc",
  })

  const createMutation = useFrappeCreateDoc()
;
  console.log("subtasks_of_task_query", subtasks_of_task_query.data);

  const handleAddTask = () => {
    setIsAdding(true);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      // Create task with parent task reference
      console.log("Creating subtask:", inputValue, "for parent:", task);
      // Add your API call here
      createMutation.createDoc("Task", {
        subject: inputValue.trim(),
        parent_task: task,
        status: "Open",
      }).then(() => {
        subtasks_of_task_query.mutate();
      });
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
        {task?.subtasks?.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-600">
                <th className="text-left px-2 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Name
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
              {task.subtasks.map((subtask) => (
                <tr
                  key={subtask.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-2 py-2 text-slate-900 dark:text-slate-100">
                    {subtask.name}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${subtask.priority === "High" ? "bg-red-100 text-red-700" : subtask.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                    >
                      {subtask.priority}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-slate-600 dark:text-slate-400">
                    {subtask.assignee || "—"}
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
