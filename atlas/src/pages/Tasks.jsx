import { Filter, Hamburger, Menu, Plus, Search } from "lucide-react";
import React, { act, useEffect } from "react";
import Card from "../components/ui/Card";
import {
  INITIAL_TASKS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_COLORS,
} from "../data/constants";
import Badge from "../components/ui/Badge";
import {
  useFrappeCreateDoc,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
  useSWRConfig,
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
import {
  Avatar,
  Button,
  Dropdown,
  Input,
  Progress,
  Select,
  Tooltip,
} from "antd";
import BacklogView from "../views/BacklogView/BacklogView";
import { set } from "react-hook-form";
import AIArchitect from "./AIArchitect";
import { AssigneeSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import AvatarGen from "../components/AvatarGen";
import ListView from "../views/ListView";
import PreviewAssignees from "../components/PreviewAssignees";
import CycleModal from "../components/custom/CycleModal";
import CompleteCycleModal from "../components/custom/CompleteCycleModal";
import { useQueryParams } from "../hooks/useQueryParams";
import ProjectHealth from "../components/ProjectHealth";
import ManageProjectPeople from "../modals/ManageProjectPeople";

const Tasks = () => {
  // const [isOpen, setIsOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const qp = useQueryParams();
  const [showFilters, setShowFilters] = React.useState(false);
  const filtersRef = React.useRef(null);

  const view = params.view || "table";
  const project = qp.get("project") || null;
  const statusFilter = qp.getArray("status");
  const priorityFilter = qp.getArray("priority");
  const { mutate } = useSWRConfig();

  // const selectedTask = searchParams.get("selected_task") || null;
  // const project = searchParams.get("project") || null;
  const navigate = useNavigate();
  const createMutation = useFrappeCreateDoc();
  const updateMutation = useFrappeUpdateDoc();

  // const query = useDoctypeSchema("Task");
  const create_cycles_for_project_mutatation = useFrappePostCall(
    "infintrix_atlas.api.v1.create_cycles_for_project",
  );
  const project_query = useFrappeGetDoc(
    "Project",
    project,
    project ? ["Project", project] : null,
  );
  const active_cycle_query = useFrappeGetDocList("Cycle", {
    filters: { project: project, status: "Active" },
  });

  const projects_options_query = useFrappeGetDocList("Project", {
    fields: ["name as value", "project_name as label"],
    limit_page_length: 100,
  });

  const cycles_template_options_query = useFrappeGetDocList("Cycle Template", {
    fields: ["name as value", "name as label"],
    limit_page_length: 100,
  });
  const cycle = (active_cycle_query?.data || [])[0];
  const active_cycle_name = cycle?.name;

  const tabs = [
    { id: "ai-architect", label: "AI Architect" },
    { id: "list", label: "List" },
    { id: "backlog", label: "Backlog" },
    // { id: "list", label: "List" },
    { id: "kanban", label: "Kanban" },
  ];

  if (active_cycle_query.isLoading || projects_options_query.isLoading) {
    return <div>Loading...</div>;
  }

  const project_data = project_query?.data || {};
  const assignees = (project_data?.users || []).map((u) => u.user);

  const hasActiveFilters =
    (statusFilter && statusFilter.length > 0) ||
    (priorityFilter && priorityFilter.length > 0) ||
    !!qp.get("search");

  useEffect(() => {
    if (!showFilters) return;

    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);
  return (
    <>
      <div className="space-y-2 md:space-y-1">
        {/* Header Section */}
        {project_data.project_name && (
          <div className="flex items-center justify-between space-x-3">
            <div>
              {/* <Select
                variant="borderless"
                placeholder="Filter by Project"
                style={{
                  // width: "100%",
                  size: "large",
                  fontSize: "24px",
                  fontWeight: "600",
                }}
                defaultValue={qp.get("project") || []}
                value={qp.get("project") || []}
                onChange={(value) => {
                  qp.set("project", value);
                }}
                options={projects_options_query?.data || []}
              /> */}
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1">


                <div className="flex space-x-1 overflow-x-auto">
                  {(projects_options_query?.data || []).map((project) => (
                    <button
                      onClick={() => {
                        if (project.value === qp.get("project")) {
                          qp.set("project", "");
                        } else {
                          qp.set("project", project.value);
                        }
                      }}
                      className={`shrink-0 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${qp.get("project") === project.value
                          ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-md"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      key={project.value}
                    >
                      {project.label}
                      {/* <span
                        className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${qp.get("project") === project.value
                            ? "bg-white/20"
                            : "bg-slate-200 dark:bg-slate-600"
                          }`}
                      >
                        {( projects_options_query?.data || []).filter((p) => p.name === project.value).length}
                      </span> */}
                    </button>
                  ))}
                </div>
              </div>

             
            </div>
            <Select
              variant="borderless"
              placeholder="Filter by Project"
              style={{
                // width: "100%",
                size: "large",
                fontSize: "14px",
                fontWeight: "600",
              }}
              defaultValue={project_data.custom_execution_mode || "Kanban"}
              value={project_data.custom_execution_mode || "Kanban"}
              onChange={(value) => {
                updateMutation
                  .updateDoc("Project", project, {
                    custom_execution_mode: value,
                  })
                  .then(() => {
                    project_query.mutate();
                    projects_options_query.mutate();
                  });
              }}
              options={[
                {
                  label: "Scrum",
                  value: "Scrum",
                },
                {
                  label: "Kanban",
                  value: "Kanban",
                },
              ]}
            />
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Tabs */}

          <div className="flex items-center border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
            <div className="flex space-x-4 md:space-x-6 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    const oldSearchParams = new URLSearchParams(
                      searchParams.toString(),
                    );
                    navigate(`/tasks/${tab.id}`);
                    setSearchParams(oldSearchParams);
                  }}
                  className={`cursor-pointer pb-2 text-sm font-semibold transition-all relative whitespace-nowrap ${view === tab.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  {tab.label}
                  {view === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 animate-in slide-in-from-left-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button
              className="relative p-2 md:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <Filter size={18} className="md:w-5 md:h-5" />
              {hasActiveFilters && (
                <span className="absolute -top-0.5 -right-0.5 inline-block w-2 h-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800" />
              )}
            </Button>
            {project_data.custom_execution_mode === "Scrum" && (
              <>
                <Button
                  onClick={() => {
                    createMutation
                      .createDoc("Cycle", {
                        project: project,
                      })
                      .then(() => {
                        mutate(["cycles", project]);
                      });
                  }}
                >
                  Create Cycle
                </Button>

                <Select
                  placeholder="Create Cycle From Template"
                  style={{ width: 200 }}
                  onChange={(value) => {
                    create_cycles_for_project_mutatation.call({
                      cycle_template_name: value,
                      project_id: project,
                    });
                  }}
                  options={cycles_template_options_query?.data || []}
                />

                {active_cycle_name && (
                  <Button
                    type="dashed"
                    onClick={() => {
                      searchParams.set("complete_cycle", active_cycle_name);
                      setSearchParams(searchParams);
                    }}
                  >
                    Complete Cycle
                  </Button>
                )}
              </>
            )}

             <Dropdown
                trigger={"click"}
                menu={{
                  onClick: ({ key }) => {
                    if (key === "manage_people") {
                      qp.set("manage_project_people", "1");
                    }
                  },
                  items: [
                    {
                      key: "manage_people",
                      label: "Manage People",
                    },
                  ],
                }}
              >
                <Button icon={<Menu size={16} />}></Button>
              </Dropdown>

            <Button
              type="primary"
              onClick={() => {
                searchParams.set("doctype", "Task");
                searchParams.set("mode", "create" || "");
                setSearchParams(searchParams);
              }}
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Create Task</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="hidden md:block" style={{ width: 200 }} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            <div className="flex -space-x-2">
            </div>

            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">
                Only my issues
              </button>
              <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">
                Recently updated
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div
            ref={filtersRef}
            className="flex flex-wrap items-center gap-3 md:gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3"
          >
            <Input
              placeholder="Search by task name"
              style={{ minWidth: 220, maxWidth: 260 }}
              value={qp.get("search") || ""}
              onChange={(e) => qp.set("search", e.target.value)}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder="Filter by status"
              style={{ minWidth: 220 }}
              value={statusFilter}
              options={Object.keys(TASK_STATUS_COLORS)
                .filter((status) => status !== "Backlog")
                .map((status) => ({
                  label: status,
                  value: status,
                }))}
              getPopupContainer={() => filtersRef.current || document.body}
              onChange={(values) => qp.setArray("status", values)}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder="Filter by priority"
              style={{ minWidth: 220 }}
              value={priorityFilter}
              options={Object.keys(TASK_PRIORITY_COLORS).map((priority) => ({
                label: priority,
                value: priority,
              }))}
              getPopupContainer={() => filtersRef.current || document.body}
              onChange={(values) => qp.setArray("priority", values)}
            />
            <Button
              type="link"
              onClick={() => {
                qp.clear("status");
                qp.clear("priority");
                qp.clear("search");
              }}
              className="px-0 text-xs md:text-sm"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* View Content */}
        <div className="overflow-x-auto">
          {view === "ai-architect" && <AIArchitect />}
          {view === "list" && <TableView />}
          {view === "kanban" && <KanbanView />}
          {view === "backlog" && <BacklogView />}
        </div>
      </div>
      <CompleteCycleModal />
      <CycleModal />
      <ManageProjectPeople />
      <TaskDetail />

      <ProjectHealth project_id={project} collapsible={true} />
    </>
  );
};

export default Tasks;
