import {
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import { CheckCircle, CheckSquare, CircleIcon, Plus, Unlink, X } from "lucide-react";
import React, { useState } from "react";
import { useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PriorityWidget from "./widgets/PriorityWidget";
import { Button, message } from "antd";
import { UsersSelectWidget } from "./widgets/AssigneeSelectWidget";
import {
  useAssigneeOfTask,
  useAssigneeUpdateMutation,
  useSubtasksQuery,
  useTasksQuery,
} from "../hooks/query";
const SubTasks = React.memo(({ task }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const subtasks_of_task_query = useSubtasksQuery(task);
  const task_detail_query = useFrappeGetDoc("Task", task);
  const assignee_update_mutation = useAssigneeUpdateMutation();
  const remove_subtask_mutation =  useFrappePostCall("infintrix_atlas.api.v1.remove_subtask")

  const subtasks = subtasks_of_task_query?.data?.message || [];


  const createMutation = useFrappeCreateDoc();
  const updateMutation = useFrappeUpdateDoc();
  const parent_task = task_detail_query.data || {};

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
  const handleAddTask = () => {
    setIsAdding(true);
    setInputValue("");
  };

  const setParentTaskIsGroup = () => {
    if (!parent_task.is_group) {
      updateMutation
        .updateDoc("Task", parent_task.name, { is_group: 1 })
        .then(() => {
          task_detail_query.mutate();
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

      updateMutation
        .updateDoc("Task", parent_task.name, { is_group: 1 })
        .finally(() => {
          createSubTask();
          task_detail_query.refetch();
        });

      setIsAdding(false);
      setInputValue("");
    } else if (e.key === "Escape") {
      setIsAdding(false);
    }
  };

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
                <th className="text-left px-2 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subtasks.map((subtask, index) => {
                return (
                  <tr
                    key={`${subtask.id}-${index}`}
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
                          updateMutation
                            .updateDoc("Task", subtask.name, { priority: v })
                            .then(() => subtasks_of_task_query.mutate());
                        }}
                      />
                    </td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-400">
                      <UsersSelectWidget
                        show_label={true}
                        mode="assignee"
                        value={subtask.assignee}
                        onSelect={(key) => {
                          assignee_update_mutation
                            .call({
                              task_name: subtask.name,
                              new_assignee: key,
                            })
                            .then(() => {
                              subtasks_of_task_query.mutate();
                            });
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${subtask.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {subtask.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span>
                        <Button
                          loading={updateMutation.loading}
                          color="red"
                          onClick={() => {
                            let status_to_set =
                              subtask.status === "Completed"
                                ? "Open"
                                : "Completed";

                            updateMutation
                              .updateDoc("Task", subtask.name, {
                                status: status_to_set,
                              })
                              .then(() => subtasks_of_task_query.mutate());
                          }}
                          type="text"
                          icon={
                            subtask.status === "Completed" ? (
                              <CheckCircle color="green" />
                            ) : (
                              <CircleIcon />
                            )
                          }
                        />
                         <Button
                          loading={updateMutation.loading}
                          color="red"
                          onClick={() => {
                           remove_subtask_mutation.call({

                              parent_task : parent_task.name,
                              subtask : subtask.name

                            }).then((response) => {
                              if(response?.message?.success){
                                message.success(response?.message?.message || "Success");
                              }
                              subtasks_of_task_query.mutate()
                            });
                          }}
                          type="text"
                          icon={ <X color="red" /> }
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {createMutation.loading && (
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td colSpan="6" className="px-2 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded animate-pulse w-24"></div>
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded animate-pulse w-32"></div>
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded animate-pulse w-20"></div>
                    </div>
                  </td>
                </tr>
              )}
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
            disabled={createMutation.loading}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter subtask name..."
            className="text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50"
          />
        ) : (
          <button
            onClick={handleAddTask}
            disabled={createMutation.loading}
            className="flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 -ml-2 rounded transition-colors disabled:opacity-50"
          >
            <Plus size={16} className="mr-1" /> Add subtask
          </button>
        )}
      </div>
    </section>
  );
});

export default SubTasks;
