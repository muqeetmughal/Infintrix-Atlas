import { useNavigate } from "react-router-dom";
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import Card from "../components/ui/Card";
import PriorityWidget from "../components/widgets/PriorityWidget";
import StatusWidget from "../components/widgets/StatusWidget";
import PreviewAssignees from "../components/PreviewAssignees";
import { useTasksQuery } from "../hooks/query";
import { Table } from "antd";

const TableView = () => {
  const tasks_list_query = useTasksQuery();
  const navigate = useNavigate();
  const updateMutation = useFrappeUpdateDoc();

  const tasks = tasks_list_query.data || [];

  if (tasks_list_query.isLoading) {
    return <div className="dark:text-slate-200">Loading...</div>;
  }

  return (
      <Table
        dataSource={tasks}
        rowKey="name"
        className="dark:bg-slate-800"
        columns={[
          {
            title: "Subject",
            dataIndex: "subject",
            key: "subject",
            render: (text, record) => (
              <div
                onClick={() => {
                  navigate(`?selected_task=${record.name}`);
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
            render: (value, record) => (
              <PriorityWidget
                value={value}
                onChange={(v) => {
                  updateMutation
                    .updateDoc("Task", record.name, {
                      priority: v,
                    })
                    .then(() => {
                      // task.mutate();
                    });
                }}
              />
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (value, record) => (
              <StatusWidget
                value={value}
                onChange={(v) => {
                  updateMutation
                    .updateDoc("Task", record.name, {
                      status: v,
                    })
                    .then(() => {
                      // task.mutate();
                    });
                }}
              />
            ),
          },
          {
            title: "Assignee",
            dataIndex: "assignees",
            key: "assignees",
            render: (assignees) => (
              <PreviewAssignees assignees={assignees} enable_tooltip={false} />
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
