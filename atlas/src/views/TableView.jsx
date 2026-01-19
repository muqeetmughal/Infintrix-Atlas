import React from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Assignee from "../components/widgets/Assignee";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { TASK_STATUS_COLORS } from "../data/constants";
import PriorityWidget from "../components/widgets/PriorityWidget";
import StatusWidget from "../components/widgets/StatusWidget";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";
import { AssigneeSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import PreviewAssignees from "../components/PreviewAssignees";
import { useTasksQuery } from "../hooks/query";
import { Table } from "antd";

const TableView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tasks_list_query = useTasksQuery();
  const navigate = useNavigate();
  const updateMutation = useFrappeUpdateDoc();

  const tasks = tasks_list_query.data || [];

  if (tasks_list_query.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-0">
      <Table
        dataSource={tasks}
        rowKey="name"
        // onRow={(record) => {
        //   return {
        //     onClick: () => {
        //       navigate(`?selected_task=${record.name}`);
        //     },
        //   };
        // }}
        columns={[
          {
            title: "Subject",
            dataIndex: "subject",
            key: "subject",
            render: (text,record) => (
              <div onClick={()=>{
                navigate(`?selected_task=${record.name}`);
              }} className="font-mono text-slate-900">{text}</div>
            ),
          },
          {
            title: "Project",
            dataIndex: "project",
            key: "project",
            render: (text) => (
              <div className="text-sm font-medium text-slate-600">{text}</div>
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
              <div className="text-xs font-bold text-slate-400">{text}</div>
            ),
          },
        ]}
      />
    </Card>
  );
  // return (
  //   <Card className="p-0">
  //     <div className="overflow-x-auto">
  //       <table className="w-full text-left">
  //         <thead className="bg-slate-50/50 border-b border-slate-100">
  //           <tr>
  //             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">
  //               Subject
  //             </th>
  //             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">
  //               Project
  //             </th>
  //             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">
  //               Priority
  //             </th>
  //             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">
  //               Status
  //             </th>
  //             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">
  //               Assignee
  //             </th>
  //             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">
  //               Deadline
  //             </th>
  //           </tr>
  //         </thead>
  //         <tbody className="divide-y divide-slate-50">
  //           {tasks.map((t) => (
  //             <tr
  //               key={t.name}
  //               className="hover:bg-slate-50/50 transition-colors group"
  //             >
  //               <td className="p-6">
  //                 {/* <div className="cursor-pointer font-bold text-slate-900">{t.subject}</div> */}
  //                 <div
  //                   onClick={() => {
  //                     searchParams.set("selected_task", t.name);
  //                     setSearchParams(searchParams);
  //                   }}
  //                   className="font-mono cursor-pointer text-slate-900 hover:underline"
  //                 >
  //                   {t.title}
  //                 </div>
  //               </td>
  //               <td className="p-6 text-sm font-medium text-slate-600">
  //                 {t.project}
  //               </td>
  //               <td className="p-6">
  //                 <PriorityWidget
  //                   value={t.priority}
  //                   onChange={(v) => {
  //                     console.log(v);
  //                     updateMutation
  //                       .updateDoc("Task", t.name, {
  //                         priority: v,
  //                       })
  //                       .then(() => {
  //                         // task.mutate();
  //                       });
  //                   }}
  //                 />
  //               </td>
  //               <td className="p-6">

  //                 <StatusWidget
  //                   value={t.status}
  //                   onChange={(v) => {
  //                     updateMutation
  //                       .updateDoc("Task", t.name, {
  //                         status: v,
  //                       })
  //                       .then(() => {
  //                         // task.mutate();
  //                       });
  //                   }}
  //                 />
  //               </td>
  //               <td className="p-6">
  //                 <div className="flex items-center space-x-2">
  //                   {/* <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{t.assignee?.charAt(0)}</div> */}
  //                   {/* <Assignee assignees={t.assignees} /> */}
  //                   <PreviewAssignees assignees={t.assignees} enable_tooltip={false} />
  //                 </div>
  //               </td>
  //               <td className="p-6 text-xs font-bold text-slate-400">
  //                 {t.exp_end_date}
  //               </td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     </div>
  //   </Card>
  // );
};

export default TableView;
