import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  Layers,
  Mail,
  MapPin,
  ShieldCheck,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "../hooks/query";
import { Badge } from "antd";
import HeatmapWidget from "./HeatmapWidget";
import { useFrappeGetDoc, useFrappeGetDocList } from "frappe-react-sdk";

const TaskFromTodo = ({ todo }) => {
  const task_query = useFrappeGetDoc("Task", todo.reference_name);
  const task = task_query.data || {};
  //   console.log("Task query data for", todo.reference_name, ":", task);
  return (
    <div
      key={task.name}
      className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl group hover:bg-indigo-50 dark:hover:bg-slate-900 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-slate-700"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
          {task.status === "Completed" ? (
            <CheckCircle2 size={20} />
          ) : (
            <Zap size={20} />
          )}
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
            {task.subject}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">
            {task.name} • {task.custom_cycle}
          </p>
        </div>
      </div>
      <Badge variant={task.status === "Completed" ? "success" : "warning"}>
        {task.status}
      </Badge>
    </div>
  );
};
const UserDetails = ({ user = {} }) => {
  const tasks = [
    {
      id: "T-101",
      subject: "Configure SAML Metadata",
      reqId: "REQ-01",
      status: "Completed",
      assignee: "Alex Rivera",
      priority: "High",
      cycle: "Sprint 12",
    },
    {
      id: "T-102",
      subject: "OAuth2 Client Secret Logic",
      reqId: "REQ-01",
      status: "Working",
      assignee: "Jane Smith",
      priority: "High",
      cycle: "Sprint 12",
    },
    {
      id: "T-103",
      subject: "Inventory DB Schema",
      reqId: "REQ-02",
      status: "Open",
      assignee: "Alex Rivera",
      priority: "Medium",
      cycle: "Sprint 13",
      blocked: true,
      blockedReason: "Awaiting schema approval",
    },
  ];

  const user_tasks_query = useFrappeGetDocList(
    "ToDo",
    {
      filters: [
        ["reference_type", "=", "Task"],
        ["allocated_to", "=", user?.name || ""],
        //   ["status", "=", "Open"],
      ],
      fields: ["reference_name", "status"],
      limit_page_length: 100,
    },
    user ? ["user_tasks", user.name] : null,
  );
  const userTodos = user_tasks_query?.data || [];
  console.log("User tasks query data:", userTodos);

  //   const userTasks = tasks.filter((t) => t.assignee === user.name);
  const completed = userTodos.filter((t) => t.status === "Completed").length;
  const progress =
    userTodos.length > 0 ? (completed / userTodos.length) * 100 : 0;

  // Mocked historical data for "Very Detailed" profile
  const skills = [
    { name: "System Architecture", score: 92 },
    { name: "React Development", score: 88 },
    { name: "PostgreSQL Optimization", score: 85 },
    { name: "Security Audits", score: 78 },
  ];

  const projectHistory = [
    {
      name: "Global Supply Sync",
      role: "Lead Architect",
      duration: "6 Months",
      status: "Delivered",
    },
    {
      name: "Auth Module V2",
      role: "Senior Developer",
      duration: "3 Months",
      status: "Stable",
    },
    {
      name: "Mobile POS Alpha",
      role: "Security Consultant",
      duration: "2 Months",
      status: "Handoff",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[48px] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center gap-10 relative">
          <div className="w-40 h-40 bg-slate-900 dark:bg-slate-800 rounded-[40px] flex items-center justify-center text-white text-5xl font-black italic shadow-2xl relative overflow-hidden">
            {user?.user_image ? (
              <img
                src={user.user_image}
                alt={user?.full_name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              user?.full_name && user.full_name.charAt(0)
            )}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl border-[6px] border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
              <ShieldCheck size={20} className="text-white" />
            </div>
          </div>
          <div className="text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <h2 className="text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">
                {user?.full_name}
              </h2>
              <Badge
                count="Architect Grade"
                style={{ backgroundColor: "#1890ff" }}
              />
            </div>
            <p className="text-slate-400 dark:text-slate-300 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center md:justify-start gap-2">
              <Briefcase size={16} className="text-indigo-500" /> Lead
              Infrastructure Specialist
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <MapPin
                  size={14}
                  className="text-slate-300 dark:text-slate-500"
                />{" "}
                San Francisco Hub
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <Mail
                  size={14}
                  className="text-slate-300 dark:text-slate-500"
                />{" "}
                alex.r@architect.io
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                <Clock size={14} /> Focus Mode Active
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics & Scores */}
        <div className="space-y-8">
          <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-[40px] p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                <TrendingUp size={14} /> Performance Velocity
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-5xl font-black tracking-tighter">
                    {Math.round(progress)}%
                  </span>
                  <span className="text-xs font-bold text-slate-400 mb-1">
                    {completed} Tasks Cleared
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-[8px] font-black text-slate-500 uppercase">
                      Latency
                    </div>
                    <div className="text-sm font-black text-white">-14.2%</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-[8px] font-black text-slate-500 uppercase">
                      Quality
                    </div>
                    <div className="text-sm font-black text-emerald-400">
                      4.9/5
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Cpu size={14} /> Competency Matrix
            </h3>
            <div className="space-y-5">
              {skills.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-700 dark:text-slate-200">
                      {skill.name}
                    </span>
                    <span className="text-indigo-600">{skill.score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 dark:bg-slate-200 rounded-full transition-all duration-700"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Work History & Heatmap */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} /> Execution Roadmap History
              </h3>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest cursor-pointer">
                Export Dossier
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projectHistory.map((proj) => (
                <div
                  key={proj.name}
                  className="p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all group"
                >
                  <div className="text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">
                    {proj.status}
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors mb-1 truncate">
                    {proj.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic mb-4">
                    {proj.role}
                  </p>
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase">
                    <Clock size={10} /> {proj.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Flame size={14} className="text-orange-500" /> Contribution
              Heatmap (LTM)
            </h3>

            <HeatmapWidget />
            {/* <div className="flex flex-wrap gap-2 justify-between">
                        {Array.from({ length: 42 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-md transition-all cursor-help ${
                                    i % 7 === 0
                                        ? "bg-indigo-600 shadow-md shadow-indigo-100 dark:shadow-indigo-500/20"
                                        : i % 3 === 0
                                            ? "bg-indigo-400"
                                            : i % 2 === 0
                                                ? "bg-indigo-200 dark:bg-indigo-300"
                                                : "bg-slate-100 dark:bg-slate-800"
                                }`}
                                title={`${Math.floor(Math.random() * 10)} events on this day`}
                            />
                        ))}
                    </div> */}
            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-300">
                    Consistency Lead
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-300">
                    Quality Champion
                  </span>
                </div>
              </div>
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                Detailed Audit <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area: Active Task Queue Context */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-6">
          Current In-Flight Tasks
        </h3>
        <div className="space-y-4">
          {userTodos.map((user_todo) => {
            // if (user_todo.status === "Open")  return <TaskFromTodo key={user_todo.name} todo={user_todo} />;

            return <TaskFromTodo key={user_todo.name} todo={user_todo} />;

          })}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
