import { Badge } from "antd";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import RelativeTime from "../components/RelativeTIme";

const ROLES = {
  PM: "Project Manager",
  STAFF: "Staff",
  CLIENT: "Client",
};

const TeamMemberCard = ({ member }) => {
  const displayName = member.full_name || member.first_name || member.email;
  const statusLabel = member.enabled ? "Active" : "Disabled";
  const statusColor = member.enabled ? "success" : "warning";
  const locationLabel = member.time_zone || "—";
  const avatarFallback = displayName?.charAt(0) || "?";

  const session_exists_query = useFrappeGetDocList("Sessions", {}, { user: member.name });
    console.log(session_exists_query)
  return (
    <div
      key={member.name}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[40px] shadow-sm dark:shadow-none hover:shadow-xl transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        {member.user_image ? (
          <img
            src={member.user_image}
            alt={displayName}
            className="w-16 h-16 rounded-[24px] object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-700 rounded-[24px] flex items-center justify-center text-white font-black text-xl italic group-hover:bg-indigo-600 transition-colors">
            {avatarFallback}
          </div>
        )}
        <div className="flex flex-col items-end gap-2">
          <Badge status={statusColor}>{statusLabel}</Badge>
          <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase">
            {locationLabel}
          </span>
        </div>
      </div>

      <div className="space-y-1 mb-6">
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
          {displayName}
        </h3>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {member.user_type || "User"}
        </p>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
          {member.email}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
        <div>
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Username
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800 dark:text-slate-200">
              {member.username || "—"}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Last Active
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800 dark:text-slate-200">
              {<RelativeTime date={member.last_active} /> || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          to={`/team/${member.name}`}
          className="flex-1 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all text-center"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

const Team = () => {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const userRole = ROLES.PM;

  const team_query = useFrappeGetDocList("User", {
    fields: ["*"],
    filters: [
      ["enabled", "=", 1],
      ["name", "!=", "Guest"],
    ],
    limit_page_length: 50,
    order_by: {
      field: "creation",
      order: "asc",
    },
  });

  const teamData = team_query.data || [];
  const depts = ["All", ...new Set(teamData.map((m) => m.dept))];

  const filteredTeam = teamData.filter(
    (m) =>
      (filterDept === "All" || m.dept === filterDept) &&
      ((m.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.name || "").toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Project Team
          </h2>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            {teamData.length} Contributors Assigned
          </p>
        </div>
        {userRole === ROLES.PM && (
          <button className="bg-slate-900 dark:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none">
            <UserPlus size={20} /> Invite Member
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm dark:shadow-none">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Filter by name or role..."
            className="w-full pl-14 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {depts.map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterDept === dept
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeam.map((member) => (
          <TeamMemberCard key={member.name} member={member} />
        ))}
      </div>
    </div>
  );
};

export default Team;
