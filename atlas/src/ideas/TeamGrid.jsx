import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  MessageSquare, 
  MapPin, 
  ExternalLink,
  ShieldCheck,
  Star,
  Zap,
  ChevronRight,
  Globe,
  Briefcase,
  Layers,
  TrendingUp,
  X
} from 'lucide-react';

// --- Mock Data ---

const DEPARTMENTS = ["All Departments", "Engineering", "Design", "Product", "Growth", "Legal"];

const TEAM_MEMBERS = [
  { id: 'U1', name: "Alex Rivera", role: "Senior Full Stack Engineer", dept: "Engineering", status: "Focus Mode", email: "alex.r@erpnext.io", location: "San Francisco", skills: ["React", "Python", "AWS"], projects: 4 },
  { id: 'U2', name: "Sarah Chen", role: "UX Design Lead", dept: "Design", status: "Active", email: "sarah.c@erpnext.io", location: "Vancouver", skills: ["Figma", "Research", "CSS"], projects: 6 },
  { id: 'U3', name: "Mike Ross", role: "Product Manager", dept: "Product", status: "In Meeting", email: "mike.r@erpnext.io", location: "New York", skills: ["Agile", "Roadmapping"], projects: 3 },
  { id: 'U4', name: "Jane Smith", role: "Backend Architect", dept: "Engineering", status: "Away", email: "jane.s@erpnext.io", location: "London", skills: ["Go", "PostgreSQL", "K8s"], projects: 5 },
  { id: 'U5', name: "David Kim", role: "Growth Lead", dept: "Growth", status: "Active", email: "david.k@erpnext.io", location: "Seoul", skills: ["SEO", "Analytics", "Ads"], projects: 2 },
  { id: 'U6', name: "Elena Rossi", role: "Legal Counsel", dept: "Legal", status: "Focus Mode", email: "elena.r@erpnext.io", location: "Rome", skills: ["Compliance", "IP Law"], projects: 8 },
  { id: 'U7', name: "Jordan Lee", role: "Frontend Dev", dept: "Engineering", status: "Active", email: "jordan.l@erpnext.io", location: "Austin", skills: ["Vue", "Tailwind"], projects: 4 },
  { id: 'U8', name: "Aisha Khan", role: "Content Strategist", dept: "Growth", status: "Active", email: "aisha.k@erpnext.io", location: "Dubai", skills: ["Copy", "PR"], projects: 5 },
];

// --- Sub-Components ---

const StatusBadge = ({ status }) => {
  const configs = {
    'Active': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Focus Mode': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'In Meeting': 'bg-amber-50 text-amber-600 border-amber-100',
    'Away': 'bg-slate-100 text-slate-400 border-slate-200'
  };

  return (
    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${configs[status] || configs['Away']}`}>
      {status}
    </span>
  );
};

const UserCard = ({ user }) => (
  <div className="bg-white border border-slate-100 rounded-[40px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
    {/* Background Decoration */}
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:bg-indigo-600 transition-colors">
        {user.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={user.status} />
        <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>

    <div className="space-y-1 mb-6 relative z-10">
      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
        {user.name}
        {user.projects > 5 && <Zap size={14} className="text-amber-500 fill-amber-500" />}
      </h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{user.role}</p>
    </div>

    <div className="flex flex-wrap gap-1.5 mb-8 relative z-10">
      {user.skills.map(skill => (
        <span key={skill} className="px-2 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-tighter border border-slate-100">
          {skill}
        </span>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 relative z-10">
      <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all">
        <ExternalLink size={14} />
        Profile
      </button>
      <button className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all">
        <MessageSquare size={14} />
        Chat
      </button>
    </div>
  </div>
);

// --- Main Page ---

export default function TeamDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');

  const filteredTeam = useMemo(() => {
    return TEAM_MEMBERS.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           user.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'All Departments' || user.dept === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDept]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6 lg:p-12 pb-24">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm text-indigo-600">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Team Directory</h1>
                <p className="text-slate-400 font-bold text-sm">Managing {TEAM_MEMBERS.length} professionals across global hubs.</p>
              </div>
            </div>
          </div>
          
          <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
            <UserPlus size={18} />
            Invite Member
          </button>
        </header>

        {/* Toolbar: Search & Filters */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 max-w-md group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, role or skill..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`flex-shrink-0 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDept === dept ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Status Breakdown Bar */}
        <div className="flex flex-wrap items-center gap-6 py-2 px-6">
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Overview</span>
              <div className="h-4 w-px bg-slate-200 mx-2" />
           </div>
           {[
             { label: 'Active', count: 4, color: 'bg-emerald-500' },
             { label: 'Focus', count: 2, color: 'bg-indigo-500' },
             { label: 'Away', count: 1, color: 'bg-slate-300' },
             { label: 'Meetings', count: 1, color: 'bg-amber-500' },
           ].map(status => (
             <div key={status.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{status.count} {status.label}</span>
             </div>
           ))}
        </div>

        {/* Grid Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredTeam.length > 0 ? (
            filteredTeam.map(user => <UserCard key={user.id} user={user} />)
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                 <Search size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">No members found</h3>
                <p className="text-slate-400 font-bold text-sm">Adjust your filters or search terms to find who you're looking for.</p>
              </div>
              <button onClick={() => {setSearchQuery(''); setSelectedDept('All Departments')}} className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Clear all filters</button>
            </div>
          )}
        </div>

        {/* Footer Stats / Insights */}
        <footer className="p-8 bg-slate-900 rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Team Velocity</span>
              <div className="flex items-end gap-2">
                 <span className="text-2xl font-black">94.8%</span>
                 <TrendingUp size={16} className="text-emerald-400 mb-1" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Coverage</span>
              <div className="flex items-end gap-2">
                 <span className="text-2xl font-black">8 Hubs</span>
                 <Globe size={16} className="text-indigo-400 mb-1" />
              </div>
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Active Hiring</span>
              <span className="text-2xl font-black">3 Roles</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black text-slate-500 uppercase">System Status</div>
                <div className="text-xs font-bold text-emerald-400">All Nodes Operational</div>
             </div>
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10">
                <ShieldCheck size={24} />
             </div>
          </div>
        </footer>
      </div>
    </div>
  );
}