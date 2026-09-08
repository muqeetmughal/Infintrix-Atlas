import React from "react";
import { Edit, ExternalLink, Menu, Plus, RefreshCcw, User } from "lucide-react";
import {
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useSWRConfig,
} from "frappe-react-sdk";
import { Button, Dropdown, Select, Tag, message } from "antd";
import { useSearchParams } from "react-router-dom";
import { useQueryParams } from "../hooks/useQueryParams";
import { RequireRole } from "./auth/RequireRole";
import TaskFilters from "./TaskFilters";

const ProjectActionBar = () => {
  const qp = useQueryParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const project = qp.get("project") || null;
  const custom_phase = qp.get("custom_phase") || null;
  const { mutate } = useSWRConfig();

  const createMutation = useFrappeCreateDoc();
  const change_mode_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.set_project_mode",
  );
  const create_cycles_for_project_mutatation = useFrappePostCall(
    "infintrix_atlas.api.v1.create_cycles_for_project",
  );

  const project_query = useFrappeGetDoc(
    "Project",
    project,
    project ? ["Project", project] : null,
  );
  const project_data = project_query?.data || {};

  const active_cycle_query = useFrappeGetDocList("Cycle", {
    filters: { project, status: "Active" },
  });
  const cycles_template_options_query = useFrappeGetDocList("Phase Template", {
    fields: ["name as value", "name as label"],
    limit_page_length: 100,
  });

  const cycle = (active_cycle_query?.data || [])[0];
  const active_cycle_name = cycle?.name;

  const [pendingMode, setPendingMode] = React.useState(null);

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <RequireRole
        role="Projects Manager"
        fallback={
          <Tag color="default" style={{ fontSize: "14px", fontWeight: 600, padding: "4px 12px" }}>
            {project_data.custom_execution_mode || "Kanban"}
          </Tag>
        }
      >
        <Select
          variant="borderless"
          placeholder="Execution Mode"
          style={{ size: "large", fontSize: "14px", fontWeight: "600" }}
          value={pendingMode || project_data.custom_execution_mode || "Kanban"}
          onChange={(value) => {
            setPendingMode(value);
            change_mode_mutation
              .call({ mode: value, project })
              .then((response) => {
                if (response?.message?.success) {
                  window.location.reload();
                  message.success("Project mode updated successfully");
                } else {
                  setPendingMode(null);
                  message.error(response?.message?.message);
                }
              });
          }}
          options={[
            { label: "Scrum", value: "Scrum" },
            { label: "Kanban", value: "Kanban" },
          ]}
        />
      </RequireRole>

      <Button
        onClick={() => {
          createMutation
            .createDoc("Project Phase", { project })
            .then((response) => {
              qp.set("custom_phase", response?.name);
              mutate(["backlog_with_phases", project]);
            });
        }}
      >
        Create Phase
      </Button>

      {project_data.custom_execution_mode === "Scrum" && (
        <>
          <Button
            onClick={() => {
              createMutation
                .createDoc("Cycle", { project, phase: custom_phase })
                .then(() => {
                  mutate(["backlog_with_phases", project]);
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

      <TaskFilters />

      <Dropdown
        trigger="click"
        menu={{
          items: [
            {
              key: "open_in_desk",
              label: "Open in Desk",
              icon: <ExternalLink size={14} />,
              onClick: () => {
                window.open(`/app/project/${project}`, "_blank");
              },
            },
            {
              key: "manage_people",
              label: "Manage People",
              icon: <User size={14} />,
              onClick: () => {
                qp.set("manage_project_people", "1");
              },
            },
            {
              key: "edit_project",
              label: "Edit Project",
              icon: <Edit size={14} />,
              onClick: () => {
                qp.set("project_modal", project);
              },
            },
          ],
        }}
      >
        <Button icon={<Menu size={16} />} />
      </Dropdown>

      <Button
        onClick={() => {}}
        icon={<RefreshCcw size={16} />}
      />

      <Button
        type="primary"
        onClick={() => {
          searchParams.set("doctype", "Task");
          searchParams.set("mode", "create");
          setSearchParams(searchParams);
        }}
      >
        <Plus size={16} className="md:w-5 md:h-5" />
        <span className="text-sm md:text-base">Create Task</span>
      </Button>
    </div>
  );
};

export default ProjectActionBar;
