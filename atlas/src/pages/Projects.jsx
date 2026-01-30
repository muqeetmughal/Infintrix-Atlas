import { ArchiveIcon, ArchiveRestore, Calendar, MoreVertical, Plus } from "lucide-react";
import React, { useState } from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { INITIAL_PROJECTS, PROJECT_STATUS_COLORS } from "../data/constants";
import {
  useFrappeDeleteDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
  useSWRConfig,
} from "frappe-react-sdk";
import Assignee from "../components/widgets/Assignee";
import DocModal from "../components/form/FormRender";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDoctypeSchema, useGetDoctypeField } from "../hooks/doctype";
import { Button, Checkbox, Progress } from "antd";

const ProjectCard = ({ project: p }) => {
  const updateMutation = useFrappeUpdateDoc();
  const swr = useSWRConfig();
  const is_archived = p.custom_is_archived
  return (
    <Card className="hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden ">
      {/* Compact Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <Link key={p.name} to={`/tasks/kanban?project=${p.name}`}>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1 mb-1">
              {p.project_name}  { is_archived? <small className="bg-red-500 p-2">Archived</small> :null }
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {p.name}
            </p>
          </Link>
        </div>
        <Badge
          className={`${PROJECT_STATUS_COLORS[p.status]} text-[10px] px-2 py-0.5 ml-2 shrink-0`}
        >
          {p.status}
        </Badge>
        <Button
          onClick={() => {
            if (is_archived) {
              updateMutation.updateDoc("Project", p.name, { custom_is_archived: 0 }).then((resp) => {
                console.log("Restored", resp);
                swr.mutate(
                  (key) => Array.isArray(key) && key.some((k) => k === "Project"),
                  undefined,
                  { revalidate: true },
                );
              });
              return;
            }else{
              updateMutation.updateDoc("Project", p.name, { custom_is_archived: 1 }).then((resp) => {
                console.log("Archived", resp);
                swr.mutate(
                  (key) => Array.isArray(key) && key.some((k) => k === "Project"),
                  undefined,
                  { revalidate: true },
                );
              });

            }
          }}
          danger={is_archived ? false : true}
          size="small"
          icon={is_archived ? <ArchiveRestore size={16} /> : <ArchiveIcon size={16} />}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
          <span className="font-semibold">Priority:</span>
          <span
            className={`font-bold ${p.priority === "High" ? "text-red-600 dark:text-red-400" : p.priority === "Medium" ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}
          >
            {p.priority}
          </span>
        </div>

        {p.project_type && (
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Type:</span>
            <span className="truncate max-w-25">{p.project_type}</span>
          </div>
        )}

        {p.custom_execution_mode && (
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Mode:</span>
            <span className="truncate max-w-25">{p.custom_execution_mode}</span>
          </div>
        )}

        {p.department && (
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Dept:</span>
            <span className="truncate max-w-30">{p.department}</span>
          </div>
        )}
      </div>

      {/* Progress Bar - More Compact */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Progress
          </span>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {p.percent_complete}%
          </span>
        </div>
        <Progress
          percent={p.percent_complete}
          size="small"
          showInfo={false}
          strokeColor={{
            "0%": "#4f46e5",
            "100%": "#818cf8",
          }}
          className="[&_.ant-progress-inner]:bg-slate-100 dark:[&_.ant-progress-inner]:bg-slate-700 [&_.ant-progress-inner]:rounded-full [&_.ant-progress-bg]:h-1.5"
        />
      </div>

      {/* Compact Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
        <Assignee assignees={p?.assignees} size="sm" />
        {p.expected_end_date && (
          <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium space-x-1">
            <Calendar size={11} />
            <span>
              {new Date(p.expected_end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

const Projects = () => {
  // const [projects] = useState(INITIAL_PROJECTS);
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedProject = searchParams.get("project") || null;
  const navigate = useNavigate();

  const status_param = searchParams.get("status") || "Open";
  // const query = useDoctypeSchema("Project")
  const projects_query = useFrappeGetDocList(
    "Project",
    {
      fields: ["*"],
      limit_page_length: 5,
      orderBy: {
        field: "modified",
        order: "desc",
      },
      filters: status_param ? [["status", "=", status_param]] : [],
    },
    ["Project", status_param],
  );

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
            <Plus
              size={20}
              className="group-hover:rotate-90 transition-transform"
            />
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
                className={`shrink-0 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  status_param === status
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                key={status}
              >
                {status}
                <span
                  className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${
                    status_param === status
                      ? "bg-white/20"
                      : "bg-slate-200 dark:bg-slate-600"
                  }`}
                >
                  {projects.filter((p) => p.status === status).length}
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
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Loading projects...
              </p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar
                  size={32}
                  className="text-slate-400 dark:text-slate-500"
                />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                No projects found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Create your first project to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((p) => (
              <ProjectCard key={p.name} project={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Projects;
