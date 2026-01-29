import { Calendar, MoreVertical, Plus } from "lucide-react";
import React, { useState } from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { INITIAL_PROJECTS, PROJECT_STATUS_COLORS } from "../data/constants";
import { useFrappeGetDocList } from "frappe-react-sdk";
import Assignee from "../components/widgets/Assignee";
import DocModal from "../components/form/FormRender";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDoctypeSchema, useGetDoctypeField } from "../hooks/doctype";
import { Checkbox, Progress } from "antd";

const Projects = () => {
  // const [projects] = useState(INITIAL_PROJECTS);
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedProject = searchParams.get("project") || null;
  const navigate = useNavigate();

  const status_param = searchParams.get("status") || "Open";
  // const query = useDoctypeSchema("Project")
  const projects_query = useFrappeGetDocList("Project", {
    fields: ["*"],
    limit_page_length: 20,
    order_by: "modified desc",
    filters: status_param ? [["status", "=", status_param]] : [],
  });

  const project_status_options = useGetDoctypeField(
    "Project",
    "status",
    "options",
  );
  const project_statuses = project_status_options?.data?.options || [];

  const projects = projects_query.data || [];

  const isLoading = projects_query.isLoading;

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-1">
              Projects
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage and track all your projects
            </p>
          </div>
          <button
            onClick={() => {
              searchParams.set("doctype", "Project");
              searchParams.set("mode", "create");
              setSearchParams(searchParams);
            }}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50 hover:shadow-xl hover:shadow-indigo-300/60 dark:hover:shadow-indigo-800/60 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span>New Project</span>
          </button>
        </div>

        {/* Status Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1">
          <div className="flex space-x-1 overflow-x-auto">
            {project_statuses.map((status) => (
              <button
                onClick={() => {
                  searchParams.set("status", status);
                  setSearchParams(searchParams);
                }}
                className={`flex-shrink-0 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  status_param === status
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                key={status}
              >
                {status}
                <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${
                  status_param === status
                    ? "bg-white/20"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}>
                  {projects.filter(p => p.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Loading projects...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">No projects found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Create your first project to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Card
                key={p.name}
                className="hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30 hover:-translate-y-2 transition-all duration-300 cursor-pointer group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <Badge className={`${PROJECT_STATUS_COLORS[p.status]} shadow-sm`}>
                    {p.status}
                  </Badge>
                  <button className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Card Content */}
                <Link to={`/tasks/kanban?project=${p.name}`}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2">
                    {p.project_name}
                  </h3>
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
                  <span className="text-indigo-600 dark:text-indigo-400">{p.name}</span> • {p.project_type}
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{p.percent_complete}%</span>
                  </div>
                  <Progress
                    percent={p.percent_complete}
                    size="small"
                    showInfo={false}
                    strokeColor={{
                      "0%": "#4f46e5",
                      "100%": "#818cf8",
                    }}
                    className="[&_.ant-progress-inner]:bg-slate-100 dark:[&_.ant-progress-inner]:bg-slate-700 [&_.ant-progress-inner]:rounded-full"
                  />
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 transition-colors duration-200">
                  <Assignee assignees={p?.assignees} />
                  <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold space-x-1.5 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                    <Calendar size={13} className="group-hover:animate-pulse" />
                    <span>{p.expected_end_date}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Projects;
