import React, { useMemo, useState } from "react";
import { Button, Dropdown, message } from "antd";
import { Ellipsis } from "lucide-react";
import { Modal as AntdModal } from "antd";
import { useFrappeDeleteDoc, useFrappeUpdateDoc, useSWRConfig } from "frappe-react-sdk";
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS } from "../data/constants";
const TaskActions = React.memo(({ task }) => {
  const [open, setOpen] = useState(false);
  const { deleteDoc } = useFrappeDeleteDoc();
  const updateMutation = useFrappeUpdateDoc();
  const swr = useSWRConfig();
  const all_statuses = useMemo(
    () =>
      Object.keys(TASK_STATUS_COLORS).map((status) => {
        return {
          label: (
            <div className="flex justify-start items-center">
              {React.createElement(TASK_STATUS_ICONS[status], {
                size: 14,
                className: `text-${TASK_STATUS_COLORS[status]}-600 mr-1`,
              })}{" "}
              {status}
            </div>
          ),
          key: status,
          onClick: () => {
            updateMutation
              .updateDoc("Task", task.name, {
                status: status,
              })
              .then(() => {
                swr.mutate(
                  (key) => {
                    if (!Array.isArray(key)) return false;
                    return (
                      key.some((k) => k === "Task") ||
                      key.some((k) => k === task.name) ||
                      key.some((k) => k === "tasks") ||
                      key.some(
                        (k) =>
                          typeof k === "string" &&
                          k.toLowerCase().includes("task"),
                      ) ||
                      key.some((k) => k === "Cycle") ||
                      key.some(
                        (k) =>
                          typeof k === "string" &&
                          k.toLowerCase().includes("cycle"),
                      )
                    );
                  },
                  undefined,
                  { revalidate: true },
                );
              });
          },
        };
      }),
    [],
  );
  return (
    <Dropdown
      trigger={"click"}
      open={open}
      onOpenChange={() => {
        setOpen(!open);
      }}
      menu={{
        items: [
          {
            label: "Change Status",
            key: "change_status",
            children: all_statuses,
          },
          {
            label: "Copy Link",
            key: "copy_link",
            onClick: () => {
              const url = `${window.location.origin}/atlas/tasks/tree?project=${task.project}&selected_task=${task.name}`;
              navigator.clipboard.writeText(url);
              message.success("Task link copied to clipboard");
            },
          },
          {
            label: "Copy Key",
            key: "copy_key",
            onClick: () => {
              navigator.clipboard.writeText(task.name);
              message.success("Task key copied to clipboard");
            },
          },
          {
            label: "Archive",
            key: "archive",
          },
          {
            label: "Delete",
            key: "delete",
            danger: true,
            onClick: () => {
              AntdModal.confirm({
                title: "Delete task",
                content:
                  "Are you sure you want to delete this task? This action cannot be undone.",
                okText: "Delete",
                okType: "danger",
                cancelText: "Cancel",
                onOk: async () => {
                  if (!task.name) return;
                  deleteDoc("Task", task.name)
                    .then((response) => {
                      message.success("Task deleted successfully");
                    })
                    .catch((err) => {
                      const messageText =
                        err?.exception || "" || "Failed to delete task";

                      message.error(messageText);
                    });
                },
              });
            },
          },
        ],
      }}
    >
      <Button icon={<Ellipsis size={16} />} size="small" type="text" />
    </Dropdown>
  );
});

export default TaskActions;
