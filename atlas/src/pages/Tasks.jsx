import { Filter, Menu, Plus, RefreshCcw } from "lucide-react";
import React, { useEffect } from "react";
import { TASK_PRIORITY_COLORS, TASK_STATUS_COLORS } from "../data/constants";
import {
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
  useSWRConfig,
} from "frappe-react-sdk";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TaskDetail from "../modals/TaskDetail";
import TableView from "../views/TableView";
import KanbanView from "../views/KanbanView";
import { Button, Dropdown, Input, Select } from "antd";
import BacklogView from "../views/BacklogView/BacklogView";
import CycleModal from "../components/custom/CycleModal";
import CompleteCycleModal from "../components/custom/CompleteCycleModal";
import { useQueryParams } from "../hooks/useQueryParams";
import ProjectHealth from "../components/ProjectHealth";
import ManageProjectPeople from "../modals/ManageProjectPeople";
import TreeView from "../views/TreeView";
import InsightsView from "../views/InsightsView/InsightsView";
import KanbanView2 from "../views/KanbanView2";
import TestView from "../views/TestView";

const Tasks = () => {
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

  const navigate = useNavigate();
  const createMutation = useFrappeCreateDoc();
  const updateMutation = useFrappeUpdateDoc();
  const change_mode_mutation = useFrappePostCall("infintrix_atlas.api.v1.set_project_mode");

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
    // { id: "ai-architect", label: "AI Architect" },
    { id: "insights", label: "Insights" },
    { id: "list", label: "List" },
    { id: "backlog", label: "Backlog" },
    { id: "tree", label: "Tree" },
    { id: "kanban", label: "Kanban" },
    // { id: "kanban2", label: "Kanban 2" },
  ];

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

  if (active_cycle_query.isLoading || projects_options_query.isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <div className="space-y-2 md:space-y-1">
        {/* Header Section */}
        <div className="flex items-center justify-between space-x-3">
          <div>
            {project_data.project_name && (
              <h1 className="text-xl font-bold">{project_data.project_name}</h1>
            )}
          </div>
          {project_data.project_name && (
            <Select
              variant="borderless"
              placeholder="Execution Mode"
              style={{
                // width: "100%",
                size: "large",
                fontSize: "14px",
                fontWeight: "600",
              }}
              defaultValue={project_data.custom_execution_mode || "Kanban"}
              value={project_data.custom_execution_mode || "Kanban"}
              onChange={(value) => {
                change_mode_mutation.call({
                  mode : value,
                  project :project
                }).then(() => {
                  window.location.reload();
                })
                // updateMutation
                //   .updateDoc("Project", project, {
                //     custom_execution_mode: value,
                //   })
                //   .then(() => {
                //     project_query.mutate();
                //     projects_options_query.mutate();
                //   });
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
          )}
        </div>
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
                  className={`cursor-pointer pb-2 text-sm font-semibold transition-all relative whitespace-nowrap ${
                    view === tab.id
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
                items: [

                  {
                    key: "open_in_desk",
                    label: "Open in Desk",
                    onClick: () => {
                      window.open(`/app/project/${project}`, "_blank");
                    },
                  },
                  {
                    key: "manage_people",
                    label: "Manage People",
                    onClick: () => {
                      qp.set("manage_project_people", "1");
                    },
                  },
                  {
                    key: "edit_project",
                    label: "Edit Project",
                    onClick: () => {
                      qp.set("edit_project", project);
                    },
                  }
                 
                ],
              }}
            >
              <Button icon={<Menu size={16} />}></Button>
            </Dropdown>
             <Button
              onClick={() => {

                // Invalidate tasks query to refetch data
                
               
              }}
              icon={<RefreshCcw/>}
            >
              
            </Button>

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
        {/* 
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
        </div> */}

        {/* Advanced Filters Panel */}
        {/* {showFilters && (
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
                const params = new URLSearchParams(searchParams);
                params.delete("status");
                params.delete("priority");
                params.delete("search");
                setSearchParams(params, { replace: true });
              }}
              className="px-0 text-xs md:text-sm"
            >
              Clear filters
            </Button>
          </div>
        )} */}

        {/* View Content */}
        <div className="overflow-x-auto">
          {/* {view === "ai-architect" && <AIArchitect />} */}
          {view === "list" && <TableView />}
          {view === "kanban" && <KanbanView />}
          {view === "kanban2" && <KanbanView2 />}
          {view === "backlog" && <BacklogView />}
          {view === "tree" && <TreeView />}
          {view === "insights" && <InsightsView />}
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
