import { useNavigate } from "react-router-dom";
import { useFrappeUpdateDoc, useFrappePostCall } from "frappe-react-sdk";
import PriorityWidget from "../components/widgets/PriorityWidget";
import StatusWidget from "../components/widgets/StatusWidget";
import { useAssigneeUpdateMutation, useTasksQuery } from "../hooks/query";
import { Table } from "antd";
import { useQueryParams } from "../hooks/useQueryParams";
import RelativeTime from "../components/RelativeTime";
import { UsersSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import TaskActions from "../components/TaskActions";

const TableView = () => {
  const qp = useQueryParams();
  const project = qp.get("project") || null;
      const assignee_update_mutation = useAssigneeUpdateMutation();
  

  const tasks_list_query = useTasksQuery(project);

  const updateMutation = useFrappeUpdateDoc();
 
  const statusFilter = qp.getArray("status");
  const priorityFilter = qp.getArray("priority");
  const searchText = (qp.get("search") || "").toLowerCase();

  const tasks = (tasks_list_query?.data?.message || []).filter((task) => {
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
      rowSelection={{
        type: "checkbox",
        onChange: (selectedRowKeys, selectedRows) => {
          // const selectedNames = selectedRows.map(row => row.name);
          // qp.set("selected_tasks", selectedNames);
        },
        getCheckboxProps: (record) => ({
          name: record.name,
        }),
      }}
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
          dataIndex: "project_name",
          key: "project_name",
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
                
                  });
              }}
            />
          ),
        },
        {
          title: "Assignee",
          dataIndex: "assignee",
          key: "assignee",
          render: (assignee, record) => {
            return (
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                <UsersSelectWidget
                  value={assignee}
                  show_label={true}
                  mode={"assignee"}
                   onSelect={(value) => {
                      //  alert(value);
                      assignee_update_mutation
                        .call({
                          task_name: record.name,
                          new_assignee: value,
                        })
                        .then(() => {
                          tasks_list_query.mutate();
                        });
                    }}
                />
              </div>
            );
          },
        },
        {
          title: "Last Modified",
          dataIndex: "modified",
          key: "modified",
          render: (text) => (
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
              <RelativeTime date={text} />
            </div>
          ),
        },
        {
          title: "Actions",
          key: "actions",
          render: (_, record) => (
            <div>
              <TaskActions task={record} />
            </div>
          ),
        }
      ]}
    />
  );
};

export default TableView;
