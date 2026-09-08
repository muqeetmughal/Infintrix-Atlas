import React, { useEffect, useMemo } from "react";
import {
  useFrappeGetCall,
  useFrappeGetDoc,
} from "frappe-react-sdk";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import TaskDetail from "../modals/TaskDetail";
import TableView from "../views/TableView";
import KanbanView from "../views/KanbanView";
import BacklogView from "../views/BacklogView/BacklogView";
import CycleModal from "../components/custom/CycleModal";
import CompleteCycleModal from "../components/custom/CompleteCycleModal";
import { useQueryParams } from "../hooks/useQueryParams";
import ManageProjectPeople from "../modals/ManageProjectPeople";
import { useHasRole } from "../hooks/useRole";
import InsightsView from "../views/InsightsView/InsightsView";
import ProjectDetail from "../views/ProjectDetail";
import ProjectResourcesTab from "../views/ProjectResourcesTab";
import ProjectActionBar from "../components/ProjectActionBar";
import ProjectViewTabs from "../components/ProjectViewTabs";

const TasksContent = ({ project }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const qp = useQueryParams();
  const navigate = useNavigate();
  const { has: isProjectsManager } = useHasRole("Projects Manager");
  const canViewManagerDashboard = isProjectsManager;

  const view = params.view || "table";
  const custom_phase = qp.get("custom_phase") || null;

  const phases_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_phases",
    project ? { project } : null,
    project ? ["project_phases_active", project] : null,
  );
  const phases = useMemo(
    () => phases_query?.data?.message || [],
    [phases_query?.data?.message],
  );
  const defaultPhase = useMemo(() => {
    const active = phases.find((p) => p.status === "Active");
    if (active) return active;
    return phases.length > 0 ? phases[phases.length - 1] : null;
  }, [phases]);

  useEffect(() => {
    if (!custom_phase && defaultPhase) {
      qp.set("custom_phase", defaultPhase.name);
    }
  }, [defaultPhase, custom_phase, qp]);

  const project_query = useFrappeGetDoc(
    "Project",
    project,
    project ? ["Project", project] : null,
  );
  const project_data = project_query?.data || {};

  const customerPortalAccessQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.has_customer_portal_access",
    project ? { project } : null,
    project ? ["customer-portal-access", project] : null,
  );
  const canViewInsights =
    !isProjectsManager && !!customerPortalAccessQuery.data?.message;
  const isCustomerPortalAccessLoading =
    !isProjectsManager &&
    project &&
    (customerPortalAccessQuery.isLoading ?? customerPortalAccessQuery.loading ?? false);

  const tabs = [
    ...(canViewManagerDashboard ? [{ id: "dashboard", label: "Dashboard" }] : []),
    ...(canViewInsights ? [{ id: "insights", label: "Insights" }] : []),
    { id: "list", label: "List" },
    { id: "backlog", label: "Backlog" },
    { id: "kanban", label: "Kanban" },
    { id: "resources", label: "Resources" },
  ];
  const allowedViewIds = tabs.map((tab) => tab.id);

  useEffect(() => {
    if (isCustomerPortalAccessLoading) return;
    if (!allowedViewIds.length || allowedViewIds.includes(view)) return;

    const oldSearchParams = new URLSearchParams(searchParams.toString());
    navigate(`/tasks/${allowedViewIds[0]}`);
    setSearchParams(oldSearchParams);
  }, [
    allowedViewIds,
    isCustomerPortalAccessLoading,
    navigate,
    searchParams,
    setSearchParams,
    view,
  ]);

  return (
    <>
      <div className="space-y-2 md:space-y-1">
        <div className="flex items-center justify-between space-x-3">
          <div>
            {project_data.project_name && (
              <h1 className="text-xl font-bold">{project_data.project_name}</h1>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <ProjectViewTabs tabs={tabs} view={view} />
          <ProjectActionBar />
        </div>

        <div className="overflow-x-auto">
          {view === "list" && <TableView />}
          {view === "kanban" && <KanbanView />}
          {view === "backlog" && <BacklogView />}
          {view === "resources" && <ProjectResourcesTab projectId={project} />}
          {view === "insights" && canViewInsights && <InsightsView />}
          {view === "dashboard" && canViewManagerDashboard && <ProjectDetail />}
        </div>
      </div>
      <CompleteCycleModal />
      <CycleModal />
      <ManageProjectPeople />
      <TaskDetail />
    </>
  );
};

const Tasks = () => {
  const qp = useQueryParams();
  const project = qp.get("project") || null;
  if (!project) {
    return <Navigate to="/projects" replace />;
  }
  return <TasksContent project={project} />;
};

export default Tasks;
