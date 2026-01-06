import { Calendar, MoreVertical, Plus } from "lucide-react";
import React, { useState } from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { INITIAL_PROJECTS, PROJECT_STATUS_COLORS } from "../data/constants";
import { useFrappeGetDocList } from "frappe-react-sdk";
import Assignee from "../components/widgets/Assignee";
import DocModal from "../components/form/FormRender";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDoctypeSchema } from "../hooks/doctype";

const Projects = () => {
  // const [projects] = useState(INITIAL_PROJECTS);
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProject = searchParams.get("project") || null;
  const navigate = useNavigate();

  // const query = useDoctypeSchema("Project")
  const projects_query = useFrappeGetDocList("Project", {
    fields: ["*"],
    limit_page_length: 20,
    order_by: "modified desc",
  });
  const projects = projects_query.data || [];

  if (projects_query.isLoading) {
    return <div>Loading...</div>;
  }

  // const schema = query.data || {}

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Project Hub
          </h2>
          <button
            onClick={() => {
              searchParams.set("doctype", "Project");
              searchParams.set("mode", "create" || "");
              setSearchParams(searchParams);
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-95 transition-all duration-200"
          >
            <Plus
              size={20}
              className="group-hover:rotate-90 transition-transform"
            />
            <span>Create Project</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Card
              key={p.name}
              className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge className={PROJECT_STATUS_COLORS[p.status]}>
                  {p.status}
                </Badge>
                <button className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <MoreVertical size={20} />
                </button>
              </div>
              <Link to={`/tasks/${p.name}/kanban`}>
                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors duration-200">
                  {p.project_name}
                </h3>
              </Link>
              <p className="text-xs text-slate-400 mb-6 group-hover:text-slate-600 transition-colors duration-200">
                {p.name} • {p.project_type}
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Completion</span>
                  <span className="text-indigo-600 font-black">
                    {p.percent_complete}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000 rounded-full shadow-lg shadow-indigo-300"
                    style={{ width: `${p.percent_complete}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50 group-hover:border-indigo-100 transition-colors duration-200">
                <Assignee assignees={p?.assignees} />
                <div className="flex items-center text-[10px] text-slate-400 font-bold space-x-1 uppercase tracking-widest group-hover:text-indigo-600 transition-colors duration-200">
                  <Calendar size={12} className="group-hover:animate-pulse" />
                  <span>{p.expected_end_date}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default Projects;
