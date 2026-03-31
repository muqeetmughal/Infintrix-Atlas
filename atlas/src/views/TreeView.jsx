import React from "react";
import {
  DeleteOutlined,
  DownOutlined,
  FolderFilled,
  LinkOutlined,
} from "@ant-design/icons";
import { Button, Space, Tree, Typography } from "antd";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useQueryParams } from "../hooks/useQueryParams";
import { Folder } from "lucide-react";
import TaskActions from "../components/TaskActions";
// const treeData = [
//   {
//     title: 'parent 1',
//     key: '0-0',
//     children: [
//       {
//         title: 'parent 1-0',
//         key: '0-0-0',
//         children: [
//           {
//             title: 'leaf',
//             key: '0-0-0-0',
//           },
//           {
//             title: 'leaf',
//             key: '0-0-0-1',
//           },
//           {
//             title: 'leaf',
//             key: '0-0-0-2',
//           },
//         ],
//       },
//       {
//         title: 'parent 1-1',
//         key: '0-0-1',
//         children: [
//           {
//             title: 'leaf',
//             key: '0-0-1-0',
//           },
//         ],
//       },
//       {
//         title: 'parent 1-2',
//         key: '0-0-2',
//         children: [
//           {
//             title: 'leaf',
//             key: '0-0-2-0',
//           },
//           {
//             title: 'leaf',
//             key: '0-0-2-1',
//           },
//         ],
//       },
//     ],
//   },
// ];
const TreeView = () => {
  const qp = useQueryParams();
  const project = qp.get("project") || null;

  const tree_query = useFrappeGetCall("infintrix_atlas.api.v1.get_task_tree", {
    project,
  });

  // console.log("tree_query", tree_query);

  const onSelect = (selectedKeys, info) => {
    // console.log('selected', selectedKeys, info);
  };
  return (
    <Tree
      defaultExpandAll
      showLine
      switcherIcon={<DownOutlined />}
      // defaultExpandedKeys={['0-0-0']}
      onSelect={onSelect}
      treeData={tree_query.data?.message || []}
      fieldNames={{
        key: "name",
        title: "subject",
      }}
      icon={<FolderFilled />}
      titleRender={(node) => {
        return (
          <>
            <Typography.Text className="flex justify-center items-center"
             >
                {node.children.length > 0 && (
                  <Folder size={14} className="mr-1" />
                )}
                {node.subject}

                <Space>
                  <Button
                    icon={<LinkOutlined />}
                    size="small"
                    type="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      qp.set("selected_task", node.name);
                    }}
                  />

                  <TaskActions task={node} />
                </Space>
            </Typography.Text>
          </>
        );
      }}
    />
  );
};
export default TreeView;

// import { useState } from "react";
// import {
//   Briefcase,
//   Plus,
//   ChevronRight as ChevronRightIcon,
//   ChevronDown as ChevronDownIcon,
// } from "lucide-react";

// const TreeView = () => {
//   const [expanded, setExpanded] = useState(["PROJ-001"]);

//   const toggleExpand = (id) => {
//     setExpanded((prev) =>
//       prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
//     );
//   };

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto">
//       <h2 className="text-2xl font-black text-slate-900 tracking-tight">
//         Project Hierarchy
//       </h2>
//       <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
//         {projects.map((proj) => (
//           <div key={proj.name} className="space-y-2">
//             <div
//               onClick={() => toggleExpand(proj.name)}
//               className="flex items-center space-x-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition-all"
//             >
//               {expanded.includes(proj.name) ? (
//                 <ChevronDownIcon size={20} className="text-slate-400" />
//               ) : (
//                 <ChevronRightIcon size={20} className="text-slate-400" />
//               )}
//               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200">
//                 <Briefcase size={20} className="text-indigo-500" />
//               </div>
//               <div className="flex-1">
//                 <div className="font-bold text-slate-900">
//                   {proj.project_name}
//                 </div>
//                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
//                   {proj.name} • {proj.status}
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className="text-xs font-black text-slate-800">
//                   {proj.percent_complete}%
//                 </div>
//                 <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1">
//                   <div
//                     className="h-full bg-indigo-500 rounded-full"
//                     style={{ width: `${proj.percent_complete}%` }}
//                   />
//                 </div>
//               </div>
//             </div>

//             {expanded.includes(proj.name) && (
//               <div className="ml-12 space-y-2 border-l-2 border-slate-100 pl-6 py-2 animate-in slide-in-from-left-4 duration-300">
//                 {tasks
//                   .filter((t) => t.project === proj.name)
//                   .map((task) => (
//                     <div
//                       key={task.id}
//                       className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl transition-all group"
//                     >
//                       <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-400" />
//                       <div className="flex-1">
//                         <div className="text-sm font-bold text-slate-700">
//                           {task.subject}
//                         </div>
//                         <div className="flex items-center space-x-2 mt-0.5">
//                           <Badge className={TASK_STATUS_COLORS[task.status]}>
//                             {task.status}
//                           </Badge>
//                           <span className="text-[10px] text-slate-400 font-medium">
//                             Assigned to: {task.assignee}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 <button className="flex items-center space-x-2 p-3 text-xs font-bold text-indigo-500 hover:text-indigo-700">
//                   <Plus size={14} />
//                   <span>Add Child Task</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
// export default TreeView;
