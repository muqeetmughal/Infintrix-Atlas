import { Button, Input, Skeleton, message } from "antd";
import { useFrappeUpdateDoc, useSWRConfig } from "frappe-react-sdk";
import { Edit, X, Check } from "lucide-react";
import React from "react";
import { useSearchParams } from "react-router-dom";

const SubjectWidget = ({ task, disableClick, style, inputStyle, onUpdate }) => {
  const [editingSubject, setEditingSubject] = React.useState(false);
  const [subject, setSubject] = React.useState(task.subject);
  const [searchParams, setSearchParams] = useSearchParams();
  const updateMutation = useFrappeUpdateDoc();
  const swr = useSWRConfig();

  const handleSave = () => {
    // Use correct SDK method: updateDoc
    updateMutation
      .updateDoc("Task", task.name, {
        subject: subject,
      })
      .then((updatedTask) => {
        message.success("Task name updated successfully");
        // Immediately update parent component's task state
        if (onUpdate) {
          onUpdate({ ...task, subject: subject });
        }
        // Invalidate ALL task-related caches to ensure immediate update everywhere
        swr.mutate(
          (key) => {
            if (!Array.isArray(key)) return false;
            return (
              key.some((k) => k === "Task") ||
              key.some((k) => k === task.name) ||
              key.some((k) => k === "tasks") ||
              key.some((k) => typeof k === "string" && k.toLowerCase().includes("task")) ||
              key.some((k) => k === "Cycle") ||
              key.some((k) => typeof k === "string" && k.toLowerCase().includes("cycle"))
            );
          },
          undefined,
          { revalidate: true }
        );
        setEditingSubject(false);
      })
      .catch((err) => {
        message.error("Failed to update task name");
        console.error("Update error:", err);
      });
  };

  const handleCancel = () => {
    setSubject(task.subject);
    setEditingSubject(false);
  };
  const handleTitleClick = (e) => {
    e.stopPropagation();
    if (disableClick || task.id === "new_item") return;
    // console.log("Issue clicked:", issue, issue);
    searchParams.set("selected_task", task.id);
    setSearchParams(searchParams);
  };

  if (updateMutation.loading) {
    return <Skeleton active paragraph={false} title={{ width: "80%" }} />;
  }
  return (
    <div className="flex items-center gap-2 group min-w-0">
      {editingSubject ? (
        <>
          <Input
            autoFocus
            variant="borderless"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
            className="flex-1 min-w-0"
            style={{
              width: "auto",
              inlineSize: "auto",
              ...inputStyle,
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => {
              e.stopPropagation();
              if (e.key == "Enter") {
                handleSave();
              } else if (e.key == "Escape") {
                handleCancel();
              } else {
                return;
              }
            }}
          />
          <Button
            danger
            size="small"
            type="link"
            icon={<X size={16} />}
            onClick={handleCancel}
          />
        </>
      ) : (
        <>
          <p
            style={style}
            onClick={handleTitleClick}
            className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 whitespace-normal break-words"
          >
            {subject}
          </p>
          <Button
            type="text"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => setEditingSubject(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </>
      )}
    </div>
  );
};

export default SubjectWidget;
