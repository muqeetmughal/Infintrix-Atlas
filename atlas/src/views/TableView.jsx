import { useNavigate } from "react-router-dom";
import { useFrappeUpdateDoc, useFrappePostCall } from "frappe-react-sdk";
import Card from "../components/ui/Card";
import PriorityWidget from "../components/widgets/PriorityWidget";
import StatusWidget from "../components/widgets/StatusWidget";
import PreviewAssignees from "../components/PreviewAssignees";
import { useTasksQuery } from "../hooks/query";
import { Table } from "antd";
import { AssigneeSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import { useQueryParams } from "../hooks/useQueryParams";

const TableView = () => {
  const qp = useQueryParams();

  const tasks_list_query = useTasksQuery();
  const navigate = useNavigate();
  const updateMutation = useFrappeUpdateDoc();
  const notifyStatusChange = useFrappePostCall(
    "infintrix_atlas.api.v1.notify_status_changed",
  );

  const statusFilter = qp.getArray("status");
  const priorityFilter = qp.getArray("priority");
  const searchText = (qp.get("search") || "").toLowerCase();

  const tasks = (tasks_list_query.data || []).filter((task) => {
    if (statusFilter.length && !statusFilter.includes(task.status)) {
      return false;
    }
    if (priorityFilter.length && !priorityFilter.includes(task.priority)) {
      return false;
    }
    if (searchText) {
      const haystack = `${task.subject || ""} ${task.name || ""}`.toLowerCase();
      if (!haystack.includes(searchText)) {
        return false;
      }
    }
    return true;
  });

  if (tasks_list_query.isLoading) {
    return <div className="dark:text-slate-200">Loading...</div>;
  }

  return (
    <Table
      dataSource={tasks}
      rowKey="name"
      className="dark:bg-slate-800"
      onRow={(record) => ({
        onClick: (e) => {
          // Don't open modal if clicking on interactive elements
          const el = e.target.closest?.("button, a, input, textarea, select, [role='button'], [role='combobox'], [role='menuitem'], .ant-dropdown, .ant-select, .ant-picker");
          if (el) return;
          qp.set("selected_task", record.name);
        },
      })}
      columns={[
        {
          title: "Subject",
          dataIndex: "subject",
          key: "subject",
          render: (text, record) => (
            <div
              onClick={() => {
                qp.set("selected_task", record.name);
              }}
              className="font-mono text-slate-900 dark:text-slate-100 cursor-pointer hover:underline"
            >
              {text}
            </div>
          ),
        },
        {
          title: "Project",
          dataIndex: "project",
          key: "project",
          render: (text) => (
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {text}
            </div>
          ),
        },
        {
          title: "Priority",
          dataIndex: "priority",
          key: "priority",
          render: (value, record) => {
            return (
              <PriorityWidget
                value={value}
                onChange={(v) => {
                  updateMutation
                    .updateDoc("Task", record.name, {
                      priority: v,
                    })
                    .then(() => {
                      tasks_list_query.mutate();
                    });
                }}
              />
            );
          },
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          render: (value, record) => (
            <StatusWidget
              value={value}
              onChange={(v) => {
                const oldStatus = value;
                updateMutation
                  .updateDoc("Task", record.name, {
                    status: v,
                  })
                  .then(() => {
                    tasks_list_query.mutate();
                    // Notify assigned users about status change
                    if (oldStatus !== v) {
                      notifyStatusChange.call({
                        task_name: record.name,
                        old_status: oldStatus,
                        new_status: v,
                      }).catch((err) => {
                        console.error("Failed to send status change notification:", err);
                      });
                    }
                  });
              }}
            />
          ),
        },
        {
          title: "Assignee",
          dataIndex: "assignees",
          key: "assignees",
          render: (assignees, record) => (
            //  <AssigneeSelectWidget task={record} />
            <AssigneeSelectWidget
              single={true}
              show_label={false}
              // value={assignees_of_task || []}
              task={record.name}
            />
          ),
        },
        {
          title: "Deadline",
          dataIndex: "exp_end_date",
          key: "exp_end_date",
          render: (text) => (
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {text}
            </div>
          ),
        },
      ]}
    />
  );
};

export default TableView;
