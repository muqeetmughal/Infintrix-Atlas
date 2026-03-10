import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShieldCheck, GitPullRequest, CheckSquare, 
  CalendarRange, History, Eye, Lock, Unlock, MoreVertical, 
  Plus, ArrowRight, User, AlertCircle, CheckCircle2, X, 
  ChevronRight, Filter, Search, MessageSquare, Zap, Clock, 
  Briefcase, Key, Mail, LogIn, ShieldAlert, TrendingUp, 
  Award, MapPin, ExternalLink, Flame, Star, Cpu, Layers, 
  Users, UserPlus, BarChart3, AlertTriangle, ArrowUpRight, 
  TrendingDown, Send, Sparkles, Bot, ChevronDown, ChevronUp,
  DollarSign, Activity, PieChart, Info, Building2
} from 'lucide-react';

// --- Roles Configuration ---
const ROLES = { PM: 'Project Manager', STAFF: 'Staff', CLIENT: 'Client' };

// --- Project Detail Data (Based on provided JSON) ---
const PROJECT_DETAIL = {
  name: "PROJ-0001",
  project_name: "GSI Project",
  status: "Open",
  priority: "Medium",
  custom_execution_mode: "Kanban",
  percent_complete: 30,
  company: "Infintrix Technologies",
  creation: "2026-01-28",
  custom_enable_ai_architect: 1,
  total_sales_amount: 0,
  total_billed_amount: 0,
  actual_time: 0,
  users: [
    {
      user: "kashi@gmail.com",
      full_name: "Kashif",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kashif", // Fallback for provided path
      email: "kashi@gmail.com"
    },
    {
      user: "muqeetmughal786@gmail.com",
      full_name: "Muqeet",
      image: "https://secure.gravatar.com/avatar/62b0decc86eb94a6c25552ebbd4268e5?d=404&s=200",
      email: "muqeetmughal786@gmail.com"
    }
  ]
};

// --- Shared Components ---

const Badge = ({ children, variant = 'neutral' }) => {
  const themes = {
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border-rose-100',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    locked: 'bg-slate-900 text-white border-slate-900'
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${themes[variant]}`}>{children}</span>;
};

// --- Section: Project Detail View ---

const SectionProjectDetail = ({ project }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const financialMetrics = [
    { label: 'Sales Amount', value: `$${project.total_sales_amount}`, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Billed Amount', value: `$${project.total_billed_amount}`, icon: BarChart3, color: 'text-indigo-500' },
    { label: 'Actual Time', value: `${project.actual_time}h`, icon: Clock, color: 'text-amber-500' },
    { label: 'Gross Margin', value: '0%', icon: TrendingUp, color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-[48px] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="locked">{project.name}</Badge>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Building2 size={12} /> {project.company}
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">{project.project_name}</h1>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <Activity size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase text-slate-600">{project.status}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <Layers size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase text-slate-600">{project.custom_execution_mode}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase text-amber-700">{project.priority} Priority</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" 
                        strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * project.percent_complete) / 100}
                        className="text-indigo-600 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{project.percent_complete}%</span>
                <span className="text-[8px] font-black text-slate-400 uppercase">Progress</span>
              </div>
            </div>
            {project.custom_enable_ai_architect === 1 && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100">
                <Sparkles size={12} className="text-white animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">AI Architect Enabled</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vital Signs (Financials) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {financialMetrics.map((m, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-[32px] hover:shadow-md transition-all">
                <div className={`w-10 h-10 bg-slate-50 ${m.color} rounded-xl flex items-center justify-center mb-4`}>
                  <m.icon size={20} />
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.label}</div>
                <div className="text-xl font-black text-slate-900">{m.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-[40px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> Project Metadata
              </h3>
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Edit Fields</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              {[
                { label: 'Created On', value: project.creation },
                { label: 'Completion Method', value: project.percent_complete_method },
                { label: 'Is Active', value: project.is_active },
                { label: 'AI Policy', value: project.custom_ai_policy === "1" ? "Active" : "Standard" },
                { label: 'Frequency', value: project.frequency },
                { label: 'Archived', value: project.custom_is_archived === 0 ? "No" : "Yes" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-xs font-bold text-slate-400">{item.label}</span>
                  <span className="text-xs font-black text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Human Roster */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Project Roster
              </h3>
              <button className="p-2 bg-slate-50 rounded-xl text-indigo-600 hover:bg-indigo-50">
                <UserPlus size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {project.users.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-[24px] group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-indigo-100 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <img src={u.image} alt={u.full_name} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm" 
                         onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${u.full_name}&background=6366f1&color=fff`; }} />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{u.full_name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 truncate w-32">{u.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all">
              Manage Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application Wrapper ---

export default function ProjectDetail() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState(ROLES.PM);
  const [activeSection, setActiveSection] = useState('Project Detail');

  const handleLogin = (role) => {
    setUserRole(role);
    setIsAuthenticated(true);
    setActiveSection('Overview');
  };

  const navItems = [
    { id: 'Overview', icon: LayoutDashboard },
    { id: 'Project Detail', icon: Briefcase },
    { id: 'Tasks', icon: CheckSquare },
    { id: 'Team', icon: Users },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-8 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white italic font-black">P</div>
          <span className="font-black text-xl tracking-tighter">ProjectX</span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeSection === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <item.icon size={20} />
              <span className="text-sm font-bold">{item.id}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">{userRole.charAt(0)}</div>
              <div className="text-xs font-bold">{userRole}</div>
           </div>
           <button onClick={() => setIsAuthenticated(false)} className="p-2 text-slate-300 hover:text-rose-500"><X size={16} /></button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full">
          {activeSection === 'Project Detail' && <SectionProjectDetail project={PROJECT_DETAIL} />}
          {activeSection !== 'Project Detail' && (
            <div className="p-20 border-4 border-dashed border-slate-200 rounded-[64px] text-center">
              <h2 className="text-2xl font-black italic">{activeSection} Module</h2>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Awaiting Data Sync from {PROJECT_DETAIL.name}</p>
              <button onClick={() => setActiveSection('Project Detail')} className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Back to Intelligence</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}