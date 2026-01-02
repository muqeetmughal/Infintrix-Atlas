import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Briefcase, CheckSquare, Clock, Settings, Plus, 
  Search, Filter, MoreVertical, ChevronRight, Calendar, Users, 
  Layers, FileText, AlertCircle, TrendingUp, ChevronDown, Wand2, 
  Check, X, UserPlus, ArrowRight, Loader2, Sparkles, Kanban, 
  GitGraph, List, RefreshCcw, BrainCircuit, ShieldAlert
} from 'lucide-react';

// --- Improved Mock Data with Advanced Metadata ---
const INITIAL_PROJECTS = [
  { name: 'PROJ-001', project_name: 'Website Redesign', status: 'Open', percent_complete: 65, expected_end_date: '2024-06-15', project_type: 'Internal' },
  { name: 'PROJ-002', project_name: 'Mobile App Dev', status: 'Open', percent_complete: 25, expected_end_date: '2024-08-01', project_type: 'External' },
];

const INITIAL_TASKS = [
  { id: 1, name: 'TASK-001', subject: 'Initial Wireframes', project: 'PROJ-001', status: 'Open', priority: 'Medium', exp_start_date: '2024-05-01', exp_end_date: '2024-05-10', assignee: 'Unassigned', points: 5, risk: 'Low' },
];

const TEAM_MEMBERS = ['John Doe', 'Jane Smith', 'Alex Rivera', 'Sarah Chen', 'Mike Ross'];

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

// --- NEW & IMPROVED AI ARCHITECT ---
const AIGeneratorView = ({ onAcceptTask }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [refiningId, setRefiningId] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Simulate complex AI analysis
    setTimeout(() => {
      const mockAISuggestions = [
        { id: 101, subject: 'Configure OAuth2 Authentication Flow', priority: 'Urgent', points: 8, risk: 'High', reason: 'High security impact', suggestedMember: 'Alex Rivera' },
        { id: 102, subject: 'Design Responsive User Dashboard', priority: 'Medium', points: 5, risk: 'Low', reason: 'Straightforward UI work', suggestedMember: 'Sarah Chen' },
        { id: 103, subject: 'Setup Automated Email Notifications', priority: 'High', points: 3, risk: 'Medium', reason: 'Requires SMTP integration', suggestedMember: 'John Doe' },
      ];
      setSuggestedTasks(mockAISuggestions);
      setIsGenerating(false);
    }, 1800);
  };

  const handleRefine = (id) => {
    setRefiningId(id);
    setTimeout(() => {
      setSuggestedTasks(prev => prev.map(t => 
        t.id === id ? { ...t, subject: t.subject + ' (Detailed Sub-tasks Added)', points: t.points + 2 } : t
      ));
      setRefiningId(null);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <BrainCircuit className="text-indigo-600" size={36} />
            AI Strategy Lab
          </h2>
          <p className="text-slate-500 max-w-md">Transform chaotic requirements into estimated, risk-assessed, and assigned backlogs.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-3">
          <Sparkles className="text-indigo-600" size={18} />
          <span className="text-xs font-bold text-indigo-700">GPT-4 Omni Powered</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card title="Input Requirements">
            <div className="space-y-4">
              <textarea
                className="w-full h-64 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
                placeholder="Paste SOW, meeting notes, or raw ideas..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {isGenerating ? 'Analyzing...' : 'Execute Analysis'}
              </button>
            </div>
          </Card>

          {suggestedTasks.length > 0 && (
            <Card title="Strategic Summary" className="bg-slate-900 text-white border-none">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-bold uppercase">Total Points</span>
                  <span className="text-xl font-black">{suggestedTasks.reduce((acc, t) => acc + t.points, 0)} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-bold uppercase">Complexity</span>
                  <span className="text-sm font-bold text-orange-400">Moderate</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <p className="text-[11px] text-slate-400 leading-relaxed italic">
                     "Based on the input, this sprint focuses on authentication and UI infrastructure. 2 High-Risk tasks identified."
                   </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Proposed Work Packages</h3>
          {suggestedTasks.length === 0 && !isGenerating && (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300">
              <FileText size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-bold">Awaiting Input for Analysis</p>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          )}

          {suggestedTasks.map((task) => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={task.risk === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}>
                      {task.risk} Risk
                    </Badge>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">{task.points} Points</Badge>
                  </div>
                  <h4 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{task.subject}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <ShieldAlert size={12} className="text-orange-400" />
                    AI Reason: {task.reason}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                   <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white font-bold">
                        {task.suggestedMember.charAt(0)}
                      </div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Auto-Assign: {task.suggestedMember}</span>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleRefine(task.id)}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                      >
                        {refiningId === task.id ? <RefreshCcw className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                      </button>
                      <button 
                        onClick={() => onAcceptTask(task)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                      >
                        <Check size={20} />
                        <span>Accept</span>
                      </button>
                   </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-40 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App & Navigation (Wrapped to match your current layout) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('ai-gen');
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const handleAcceptTask = (t) => {
    setTasks([{ ...t, id: Date.now(), status: 'Backlog', assignee: t.suggestedMember, name: `T-${Math.floor(Math.random()*9000)}` }, ...tasks]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <aside className="w-72 bg-white border-r border-slate-200 p-8 hidden lg:block">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">E</div>
          <span className="font-black text-xl tracking-tighter">ERPNext PM</span>
        </div>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('ai-gen')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'ai-gen' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <BrainCircuit size={20} /> AI Strategy
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <CheckSquare size={20} /> My Backlog ({tasks.length})
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'ai-gen' && <AIGeneratorView onAcceptTask={handleAcceptTask} />}
        {activeTab === 'dashboard' && (
          <div className="text-center py-20 text-slate-400">
            <LayoutDashboard size={64} className="mx-auto opacity-10 mb-4" />
            <h2 className="text-xl font-bold">Standard Dashboard View</h2>
            <p className="mt-2">Select AI Strategy to see the latest improvements.</p>
          </div>
        )}
        {activeTab === 'tasks' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <h2 className="text-2xl font-black mb-8">Generated Backlog</h2>
            {tasks.map(t => (
              <div key={t.id} className="p-5 bg-white border border-slate-200 rounded-3xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{t.subject}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-slate-100">{t.status}</Badge>
                    <span className="text-xs text-slate-400 font-medium">Assignee: {t.assignee}</span>
                  </div>
                </div>
                <div className="text-sm font-black text-indigo-600">{t.points} PTS</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}