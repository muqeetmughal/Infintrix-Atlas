import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Briefcase, CheckSquare, Clock, Settings, Plus, 
  Search, Filter, MoreVertical, ChevronRight, Calendar, Users, 
  Layers, FileText, AlertCircle, TrendingUp, ChevronDown, Wand2, 
  Check, X, UserPlus, ArrowRight, Loader2, Sparkles, Kanban, 
  GitGraph, List, RefreshCcw, BrainCircuit, ShieldAlert, 
  BarChart3, Thermometer, Mic, MessageSquare, Activity
} from 'lucide-react';

// --- Enhanced Mock Data ---
const TEAM_STATS = [
  { name: 'John Doe', load: 12, capacity: 20, color: 'bg-emerald-500' },
  { name: 'Jane Smith', load: 18, capacity: 20, color: 'bg-orange-500' },
  { name: 'Alex Rivera', load: 24, capacity: 20, color: 'bg-red-500' },
  { name: 'Sarah Chen', load: 5, capacity: 20, color: 'bg-blue-500' },
  { name: 'Mike Ross', load: 8, capacity: 20, color: 'bg-indigo-500' },
];

const INITIAL_PROJECTS = [
  { name: 'PROJ-001', project_name: 'Website Redesign', status: 'Open', percent_complete: 65, expected_end_date: '2024-06-15', project_type: 'Internal' },
];

// --- Utility Components ---
const Badge = ({ children, className }) => (
  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${className}`}>
    {children}
  </span>
);

const Card = ({ children, title, action, className = "" }) => (
  <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Intelligence Components ---

const ResourceHeatmap = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Load Balancing</h4>
      <span className="text-[10px] text-slate-400 font-bold">Points / Capacity</span>
    </div>
    <div className="space-y-3">
      {TEAM_STATS.map(member => (
        <div key={member.name} className="space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-700">{member.name}</span>
            <span className={member.load > member.capacity ? 'text-red-500' : 'text-slate-500'}>
              {member.load}/{member.capacity}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${member.load > member.capacity ? 'bg-red-500' : 'bg-indigo-500'} transition-all duration-500`}
              style={{ width: `${Math.min((member.load/member.capacity)*100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AIHealthIndicator = ({ prompt }) => {
  const score = useMemo(() => {
    if (!prompt) return null;
    if (prompt.length < 50) return { label: 'Vague', color: 'text-orange-500', bg: 'bg-orange-50', icon: AlertCircle };
    if (prompt.includes('urgent') || prompt.includes('immediately')) return { label: 'Volatile', color: 'text-red-500', bg: 'bg-red-50', icon: Activity };
    return { label: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: Check };
  }, [prompt]);

  if (!score) return null;

  return (
    <div className={`flex items-center gap-2 p-3 rounded-2xl border ${score.bg} animate-in fade-in zoom-in duration-300`}>
      <score.icon size={16} className={score.color} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${score.color}`}>Requirement Health: {score.label}</span>
    </div>
  );
};

// --- Main AI Architect View ---

const AIGeneratorView = ({ onAcceptTask }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const mockAISuggestions = [
        { id: 101, subject: 'Cloud Infrastructure Hardening', priority: 'Urgent', points: 8, risk: 'High', suggestedMember: 'Alex Rivera', deadline: '3 days' },
        { id: 102, subject: 'End-to-End Encryption Modules', priority: 'High', points: 5, risk: 'Medium', suggestedMember: 'John Doe', deadline: '5 days' },
        { id: 103, subject: 'Mobile Push Notification Service', priority: 'Medium', points: 3, risk: 'Low', suggestedMember: 'Sarah Chen', deadline: '2 days' },
      ];
      setSuggestedTasks(mockAISuggestions);
      setIsGenerating(false);
    }, 1500);
  };

  const totalPoints = suggestedTasks.reduce((acc, t) => acc + t.points, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <BrainCircuit size={24} />
            </div>
            Strategy Lab 4.0
          </h2>
          <p className="text-slate-400 mt-1">Predictive analysis & workload-aware task engineering.</p>
        </div>
        <div className="flex items-center gap-3">
          <AIHealthIndicator prompt={prompt} />
          <button 
            onClick={() => setIsListening(!isListening)}
            className={`p-4 rounded-2xl border transition-all ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600'}`}
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Input Requirements">
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full h-72 p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed resize-none"
                  placeholder="Type or use voice to capture scope..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                {isListening && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" />
                        <div className="w-1 h-8 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Listening...</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                Process Logic
              </button>
            </div>
          </Card>

          <Card className="bg-slate-50 border-none">
            <ResourceHeatmap />
          </Card>
        </div>

        {/* Main Workspace */}
        <div className="lg:col-span-3 space-y-6">
          {suggestedTasks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500">
               <div className="bg-white border border-slate-200 p-6 rounded-3xl">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forecast Finish</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-indigo-500" size={18} />
                    <span className="text-lg font-black text-slate-900">May 24, 2024</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 mt-1 block">Confidence: High (92%)</span>
               </div>
               <div className="bg-white border border-slate-200 p-6 rounded-3xl">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Complexity Points</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-orange-500" size={18} />
                    <span className="text-lg font-black text-slate-900">{totalPoints} Points</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">Avg 5.3 pts per task</span>
               </div>
               <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
                  <span className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Smart Recommendation</span>
                  <p className="text-xs font-bold leading-relaxed">
                    "Capacity alert: Alex Rivera is overloaded. Consider reassigning Task 101 to Sarah Chen."
                  </p>
               </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Architectural Output</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-red-400" /> High Risk
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" /> Low Risk
                </div>
              </div>
            </div>

            {suggestedTasks.length === 0 && !isGenerating && (
              <div className="h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 bg-white">
                <MessageSquare size={48} className="mb-4 opacity-10" />
                <p className="text-sm font-black uppercase tracking-widest">Feed requirements to start engine</p>
              </div>
            )}

            {suggestedTasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-2xl hover:border-indigo-200 transition-all group flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${task.risk === 'High' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {task.points}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-lg">{task.subject}</h4>
                      <Badge className={task.risk === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}>{task.risk}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><UserPlus size={14} /> Recommended: {task.suggestedMember}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> Est. {task.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                    <RefreshCcw size={20} />
                  </button>
                  <button 
                    onClick={() => onAcceptTask(task)}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                  >
                    <Check size={20} />
                    <span>Deploy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const [activeTab, setActiveTab] = useState('ai-gen');
  const [tasks, setTasks] = useState([]);

  const handleAcceptTask = (t) => {
    setTasks([{ ...t, id: Date.now(), status: 'Backlog', assignee: t.suggestedMember, name: `T-${Math.floor(Math.random()*9000)}` }, ...tasks]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100">
      <aside className="w-80 bg-white border-r border-slate-200 p-8 hidden xl:flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-xl">E</div>
          <span className="font-black text-2xl tracking-tighter">PM.Intelligence</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'ai-gen', label: 'Strategy Lab', icon: BrainCircuit, premium: true },
            { id: 'backlog', label: 'Backlog', icon: CheckSquare, count: tasks.length },
            { id: 'team', label: 'Resource Map', icon: Users },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={22} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.premium && <Sparkles size={14} className={activeTab === item.id ? 'text-indigo-200' : 'text-indigo-400'} />}
              {item.count > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{item.count}</span>}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-6 bg-slate-900 rounded-3xl text-white">
           <div className="flex items-center gap-2 mb-2">
              <Thermometer size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Temp</span>
           </div>
           <div className="text-xl font-black">Optimal (22°C)</div>
           <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tight">Everything is running on track.</p>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
           <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 block">Workforce Intelligence</span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center</h1>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <div className="text-sm font-black">Arsalan Ahmed</div>
                 <div className="text-[10px] font-bold text-slate-400">Head of Operations</div>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">AA</div>
           </div>
        </header>

        {activeTab === 'ai-gen' && <AIGeneratorView onAcceptTask={handleAcceptTask} />}
        {activeTab !== 'ai-gen' && (
           <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[40px]">
              <Activity size={64} className="mx-auto text-slate-100 mb-6" />
              <h3 className="text-2xl font-black text-slate-900">Module Integrated</h3>
              <p className="text-slate-400 mt-2 max-w-xs mx-auto">This ERPNext module is synced. Use the Strategy Lab to feed intelligence into this view.</p>
           </div>
        )}
      </main>
    </div>
  );
}