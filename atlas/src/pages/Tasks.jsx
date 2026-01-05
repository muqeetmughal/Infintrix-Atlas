import { Filter, Plus, Search } from "lucide-react";
import React, { useEffect } from "react";
import Card from "../components/ui/Card";
import {
  INITIAL_TASKS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_COLORS,
} from "../data/constants";
import Badge from "../components/ui/Badge";
import {
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
} from "frappe-react-sdk";
import dayjs from "dayjs";
import Assignee from "../components/widgets/Assignee";
import Priority from "../components/widgets/PriorityWidget";
import FormRender from "../components/form/FormRender";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDoctypeSchema } from "../hooks/doctype";
import TaskDetail from "../modals/TaskDetail";
import TableView from "../views/TableView";
import KanbanView from "../views/KanbanView";
import LinkField from "../components/form/LinkField";
import { Avatar, Input, Select, Tooltip } from "antd";
import BacklogView from "../views/BacklogView/BacklogView";
import { set } from "react-hook-form";
import AIArchitect from "./AIArchitect";
import { AssigneeSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import AvatarGen from "../components/AvatarGen";

const Tasks = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();

  const view = params.view || "table";
  const project = params.project || null;
  const selectedTask = searchParams.get("selected_task") || null;
  // const project = searchParams.get("project") || null;
  const navigate = useNavigate();

  const query = useDoctypeSchema("Task");
  const project_query = useFrappeGetDoc("Project", project);
  const tasks_query = useFrappeGetCall(
    `infintrix_atlas.api.v1.get_tasks?project=${project}`
  );
  const projects_options_query = useFrappeGetDocList("Project", {
    fields: ["name as value", "project_name as label"],
    limit_page_length: 100,
  });
  const schema = query.data || {};

  const tabs = [
    { id: "ai-architect", label: "AI Architect" },
    { id: "list", label: "List" },
    { id: "backlog", label: "Backlog" },
    { id: "table", label: "Table" },
    { id: "kanban", label: "Kanban" },
  ];

  if (tasks_query.isLoading && project_query.isLoading) {
    return <div>Loading...</div>;
  }

  const tasks = tasks_query?.data?.message || [];
  const project_data = project_query?.data || {};
  const assignees = (project_data?.users || []).map((u) => u.user);
  return (
    <>
      {/* {
        <FormRender
          doctype="Task"
          open={isOpen}
          onClose={() => setIsOpen(false)}
          full_form={false}
          defaultValues={{
            project: project || "",
          }}
        />
      } */}
      <TaskDetail />
      <div className="space-y-2 md:space-y-1">
        {/* Header Section */}
        {project_data.project_name && (
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            {project_data.project_name}
          </h1>
        )}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Tabs */}

          <div className="flex items-center border-b border-slate-100 overflow-x-auto">
            <div className="flex space-x-4 md:space-x-6 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    const oldSearchParams = new URLSearchParams(
                      searchParams.toString()
                    );
                    navigate(`/tasks/${project}/${tab.id}`);
                    setSearchParams(oldSearchParams);
                  }}
                  className={`cursor-pointer pb-2 text-sm font-semibold transition-all relative whitespace-nowrap ${
                    view === tab.id
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  {view === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-in slide-in-from-left-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button className="p-2 md:p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
              <Filter size={18} className="md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => {
                searchParams.set("doctype", "Task");
                searchParams.set("modal_type", "create" || "");
                // searchParams.set("docname", task || "");
                setSearchParams(searchParams);
                // navigate(`/tasks/${project}/ai-architect`);
                // setIsOpen(true);
                // if (schema.quick_entry) {
                //   setIsOpen(true);
                // } else {
                //   navigate("/tasks/create");
                // }
              }}
              className="cursor-pointer bg-slate-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center space-x-2 shadow-lg hover:bg-slate-800 transition-colors"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Add Task</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex max-w-full space-x-2">
            {/* <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Tasks"
                            className="w-full pl-9 pr-3 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        /> */}
            <Input
              placeholder="Search"
              style={{ width: 200 }}
              onChange={(e) => {
                searchParams.set("search", e.target.value);
                setSearchParams(searchParams);
              }}
            />
            <Select
              placeholder="Filter by Project"
              style={{ width: 200 }}
              defaultValue={project}
              value={project}
              onChange={(value) => {
                const oldSearchParams = new URLSearchParams(
                  searchParams.toString()
                );
                navigate(`/tasks/${value}/${view}`);
                setSearchParams(oldSearchParams);
              }}
              // allowClear
              // onClear={()=>{
              //     console.log("Clearing")
              //     searchParams.delete("project")
              //     setSearchParams(searchParams)
              // }}
              options={projects_options_query?.data || []}
            />
          </div>

          {/* User Avatars and Filter Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            <div className="flex -space-x-2">
              <Avatar.Group>
                {assignees.map((assignee) => {
                  return (
                    <AvatarGen name={assignee} enable_tooltip={true} />
                  );
                })}
              </Avatar.Group>
              {/* {["JD", "MM", "SK"].map((initials, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-pointer hover:-translate-y-1 transition-transform ${
                    ["bg-indigo-500", "bg-cyan-600", "bg-rose-500"][i]
                  }`}
                >
                  {initials}
                </div>
              ))} */}
              {/* <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-300 transition-colors">
                +1
              </div> */}
            </div>

            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-600 font-medium">
              <button className="hover:text-blue-600 transition-colors whitespace-nowrap">
                Only my issues
              </button>
              <button className="hover:text-blue-600 transition-colors whitespace-nowrap">
                Recently updated
              </button>
            </div>
          </div>
        </div>

        {/* View Content */}
        <div className="overflow-x-auto">
          {view === "ai-architect" && <AIArchitect />}
          {view === "table" && <TableView tasks={tasks} />}
          {view === "kanban" && <KanbanView tasks={tasks} />}
          {view === "backlog" && (
            <BacklogView initialTasks={tasks} project={project_data} />
          )}
        </div>
      </div>
    </>
  );
};

export default Tasks;
