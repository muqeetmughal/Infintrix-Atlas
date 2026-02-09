import { Button, Input, Skeleton } from "antd";
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import { Edit, X, Check } from "lucide-react";
import React from "react";
import { useSearchParams } from "react-router-dom";

const SubjectWidget = ({ task, disableClick, style, inputStyle }) => {
  const [editingSubject, setEditingSubject] = React.useState(false);
  const [subject, setSubject] = React.useState(task.subject);
  const [searchParams, setSearchParams] = useSearchParams();
  const updateMutation = useFrappeUpdateDoc();
  const handleSave = () => {
    // Add save logic here
    updateMutation.mutate(
      {
        doctype: "Task",
        name: task.id,
        subject: subject,
      },
      {
        onSuccess: () => {
          // Optionally show a success message or perform additional actions
        },
      },
    );
    setEditingSubject(false);
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
            className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 overflow-hidden text-ellipsis whitespace-nowrap"
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
