import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronRight,
  Calendar,
  Users,
  Layers,
  FileText,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  Wand2,
  Check,
  X,
  UserPlus,
  ArrowRight,
  Loader2,
  Sparkles,
  Kanban,
  GitGraph,
  List,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';

// --- Expanded Mock Data & Constants ---

const PROJECT_STATUS_COLORS = {
  'Open': 'bg-blue-100 text-blue-700 border-blue-200',
  'Completed': 'bg-green-100 text-green-700 border-green-200',
  'Cancelled': 'bg-gray-100 text-gray-700 border-gray-200',
  'On Hold': 'bg-yellow-100 text-yellow-700 border-yellow-200'
};

const TASK_STATUS_COLORS = {
  'Backlog': 'bg-slate-100 text-slate-600 border-slate-200',
  'Open': 'bg-blue-50 text-blue-600 border-blue-100',
  'Working': 'bg-amber-50 text-amber-700 border-amber-100',
  'Pending Review': 'bg-purple-50 text-purple-700 border-purple-100',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const TASK_PRIORITY_COLORS = {
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-orange-100 text-orange-600',
  'High': 'bg-red-100 text-red-600',
  'Urgent': 'bg-purple-100 text-purple-600'
};

const INITIAL_PROJECTS = [
  { name: 'PROJ-001', project_name: 'Website Redesign', status: 'Open', percent_complete: 65, expected_end_date: '2024-06-15', project_type: 'Internal' },
  { name: 'PROJ-002', project_name: 'Mobile App Dev', status: 'Open', percent_complete: 25, expected_end_date: '2024-08-01', project_type: 'External' },
  { name: 'PROJ-003', project_name: 'Cloud Migration', status: 'Completed', percent_complete: 100, expected_end_date: '2023-12-20', project_type: 'Infrastructure' },
  { name: 'PROJ-004', project_name: 'Security Audit', status: 'On Hold', percent_complete: 10, expected_end_date: '2024-10-15', project_type: 'Internal' },
];

const INITIAL_TASKS = [
  { id: 1, name: 'TASK-001', subject: 'Initial Wireframes', project: 'PROJ-001', status: 'Open', priority: 'Medium', exp_start_date: '2024-05-01', exp_end_date: '2024-05-10', assignee: 'Unassigned' },
  { id: 2, name: 'TASK-002', subject: 'Backend API Setup', project: 'PROJ-002', status: 'Working', priority: 'High', exp_start_date: '2024-05-05', exp_end_date: '2024-05-15', assignee: 'John Doe' },
  { id: 3, name: 'TASK-003', subject: 'Schema Design', project: 'PROJ-002', status: 'Completed', priority: 'Urgent', exp_start_date: '2024-04-20', exp_end_date: '2024-04-30', assignee: 'Jane Smith' },
  { id: 4, name: 'TASK-004', subject: 'Brand Identity', project: 'PROJ-001', status: 'Working', priority: 'Medium', exp_start_date: '2024-05-02', exp_end_date: '2024-05-20', assignee: 'Alex Rivera' },
  { id: 5, name: 'TASK-005', subject: 'SSL Configuration', project: 'PROJ-003', status: 'Completed', priority: 'Low', exp_start_date: '2023-12-01', exp_end_date: '2023-12-05', assignee: 'Sarah Chen' },
  { id: 6, name: 'TASK-006', subject: 'User Interview Sessions', project: 'PROJ-001', status: 'Pending Review', priority: 'High', exp_start_date: '2024-05-10', exp_end_date: '2024-05-18', assignee: 'Mike Ross' },
];

const TEAM_MEMBERS = ['John Doe', 'Jane Smith', 'Alex Rivera', 'Sarah Chen', 'Mike Ross'];

// --- Sub-Components ---

const Badge = ({ children, className }) => (
  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${className}`}>
    {children}
  </span>
);

const Card = ({ children, title, action, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Views ---

const AIGeneratorView = ({ onAcceptTask }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const mockAISuggestions = [
        { id: Date.now() + 1, subject: 'Draft Technical Specification Document', priority: 'High', weight: 3 },
        { id: Date.now() + 2, subject: 'Conduct Competitor UI/UX Benchmarking', priority: 'Medium', weight: 2 },
        { id: Date.now() + 3, subject: 'Configure CI/CD Pipelines for Staging', priority: 'Urgent', weight: 5 },
        { id: Date.now() + 4, subject: 'Implement JWT-based Authentication', priority: 'High', weight: 8 },
      ];
      setSuggestedTasks(mockAISuggestions);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-3xl text-indigo-600 mb-2 ring-8 ring-indigo-50/50">
          <Sparkles size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Task Architect</h2>
        <p className="text-slate-500 max-w-lg mx-auto">Upload your requirements and watch as AI deconstructs them into professional ERPNext tasks.</p>
      </div>

      <Card className="ring-1 ring-slate-200 shadow-xl shadow-indigo-100/20">
        <div className="space-y-4">
          <textarea
            className="w-full h-44 p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 transition-all text-lg placeholder:text-slate-300"
            placeholder="e.g., We need to migrate our legacy server to AWS, ensuring high availability and zero downtime..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-black transition-all transform active:scale-95 ${
                isGenerating || !prompt 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              }`}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
              <span>{isGenerating ? 'Architecting...' : 'Build Backlog'}</span>
            </button>
          </div>
        </div>
      </Card>

      {suggestedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
            <span>AI Suggested Backlog</span>
            <div className="h-px flex-1 bg-slate-100" />
          </h3>
          <div className="grid gap-4">
            {suggestedTasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <CheckSquare size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{task.subject}</h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <Badge className={TASK_PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                      <span className="text-xs text-slate-400">Backlog • {task.weight} pts</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSuggestedTasks(prev => prev.filter(t => t.id !== task.id))}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      onAcceptTask(task);
                      setSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
                    }}
                    className="flex items-center space-x-2 px-5 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all"
                  >
                    <Check size={20} />
                    <span>Accept</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BulkAssignView = ({ tasks, onBulkUpdate }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = () => {
    onBulkUpdate(selectedIds, { assignee: bulkAssignee, priority: bulkPriority });
    setSelectedIds([]);
    setBulkAssignee('');
    setBulkPriority('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Assignment Tool</h2>
          <p className="text-slate-500 text-sm">Optimize your workflow by assigning dozens of tasks in one go.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="p-6 w-12">
                <input 
                  type="checkbox" 
                  className="rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                  onChange={(e) => setSelectedIds(e.target.checked ? tasks.map(t => t.id) : [])}
                  checked={selectedIds.length === tasks.length && tasks.length > 0}
                />
              </th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Task / Doctype ID</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Project</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Assignee</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map(task => (
              <tr key={task.id} className={`hover:bg-indigo-50/30 transition-colors group ${selectedIds.includes(task.id) ? 'bg-indigo-50/50' : ''}`}>
                <td className="p-6">
                  <input 
                    type="checkbox" 
                    className="rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                    checked={selectedIds.includes(task.id)}
                    onChange={() => toggleSelect(task.id)}
                  />
                </td>
                <td className="p-6">
                  <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.subject}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{task.name || 'UNSYNCED'}</div>
                </td>
                <td className="p-6">
                  <span className="text-xs font-bold text-slate-500 flex items-center">
                    <Briefcase size={12} className="mr-1.5" />
                    {task.project}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-600 font-black shadow-sm">
                      {task.assignee?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{task.assignee}</span>
                  </div>
                </td>
                <td className="p-6">
                  <Badge className={TASK_PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-3xl p-5 flex items-center space-x-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300 z-50 ring-1 ring-white/10">
          <div className="px-6 border-r border-white/10">
            <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Batch Selected</span>
            <span className="text-xl font-black">{selectedIds.length} Items</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Member</label>
              <select 
                value={bulkAssignee} 
                onChange={(e) => setBulkAssignee(e.target.value)}
                className="block w-44 text-sm bg-slate-800 border-none rounded-xl focus:ring-indigo-500 text-white"
              >
                <option value="">Choose User...</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set Urgency</label>
              <select 
                value={bulkPriority} 
                onChange={(e) => setBulkPriority(e.target.value)}
                className="block w-44 text-sm bg-slate-800 border-none rounded-xl focus:ring-indigo-500 text-white"
              >
                <option value="">Priority...</option>
                {Object.keys(TASK_PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={handleBulkUpdate}
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2"
          >
            <UserPlus size={20} />
            <span>Apply Changes</span>
          </button>
          
          <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

const KanbanView = ({ tasks }) => {
  const statuses = ['Backlog', 'Open', 'Working', 'Pending Review', 'Completed'];
  
  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Board</h2>
      </div>
      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex space-x-6 min-w-max h-full">
          {statuses.map(status => (
            <div key={status} className="w-80 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col p-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                  {status}
                  <span className="ml-2 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{tasks.filter(t => t.status === status).length}</span>
                </span>
                <Plus size={16} className="text-slate-300" />
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.filter(t => t.status === status).map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={TASK_PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                      <button className="text-slate-300 group-hover:text-slate-600"><MoreVertical size={14}/></button>
                    </div>
                    <h5 className="font-bold text-slate-900 leading-tight mb-4">{task.subject}</h5>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                          {task.assignee?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{task.assignee}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-400 space-x-1">
                        <Calendar size={12} />
                        <span>{task.exp_end_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GanttView = ({ tasks }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Timeline Schedule</h2>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Months/Days */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <div className="w-64 p-4 border-r border-slate-100 font-bold text-xs text-slate-400 uppercase tracking-widest">Tasks</div>
              <div className="flex-1 flex">
                {['May 01', 'May 08', 'May 15', 'May 22', 'May 29'].map(date => (
                  <div key={date} className="flex-1 p-4 text-center text-[10px] font-bold text-slate-400 border-r border-slate-50">{date}</div>
                ))}
              </div>
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {tasks.map(task => (
                <div key={task.id} className="flex hover:bg-slate-50/30">
                  <div className="w-64 p-4 border-r border-slate-100">
                    <div className="font-bold text-slate-800 text-sm truncate">{task.subject}</div>
                    <div className="text-[10px] text-slate-400">{task.project}</div>
                  </div>
                  <div className="flex-1 p-4 relative min-h-[60px]">
                    <div 
                      className={`absolute h-8 rounded-full shadow-sm flex items-center px-4 text-[10px] font-bold text-white transition-all ${
                        task.status === 'Completed' ? 'bg-emerald-400' : 'bg-indigo-400'
                      }`}
                      style={{ 
                        left: `${Math.random() * 40}%`, // Simplified for mock visuals
                        width: `${20 + Math.random() * 40}%`
                      }}
                    >
                      {task.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const TreeView = ({ projects, tasks }) => {
  const [expanded, setExpanded] = useState(['PROJ-001']);

  const toggleExpand = (id) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Project Hierarchy</h2>
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
        {projects.map(proj => (
          <div key={proj.name} className="space-y-2">
            <div 
              onClick={() => toggleExpand(proj.name)}
              className="flex items-center space-x-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition-all"
            >
              {expanded.includes(proj.name) ? <ChevronDownIcon size={20} className="text-slate-400" /> : <ChevronRightIcon size={20} className="text-slate-400" />}
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                <Briefcase size={20} className="text-indigo-500" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900">{proj.project_name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{proj.name} • {proj.status}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-slate-800">{proj.percent_complete}%</div>
                <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1">
                  <div className="h-full bg-indigo-500 rounded-full" style={{width: `${proj.percent_complete}%`}} />
                </div>
              </div>
            </div>

            {expanded.includes(proj.name) && (
              <div className="ml-12 space-y-2 border-l-2 border-slate-100 pl-6 py-2 animate-in slide-in-from-left-4 duration-300">
                {tasks.filter(t => t.project === proj.name).map(task => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl transition-all group">
                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-400" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-700">{task.subject}</div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <Badge className={TASK_STATUS_COLORS[task.status]}>{task.status}</Badge>
                        <span className="text-[10px] text-slate-400 font-medium">Assigned to: {task.assignee}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="flex items-center space-x-2 p-3 text-xs font-bold text-indigo-500 hover:text-indigo-700">
                  <Plus size={14} />
                  <span>Add Child Task</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function Main() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [projects] = useState(INITIAL_PROJECTS);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-gen', label: 'AI Architect', icon: Wand2, highlight: true },
    { id: 'bulk-assign', label: 'Bulk Assign', icon: UserPlus },
    { id: 'projects', label: 'Project Hub', icon: Briefcase },
    { id: 'tasks', label: 'All Tasks', icon: CheckSquare },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'gantt', label: 'Timeline View', icon: GitGraph },
    { id: 'tree', label: 'Hierarchy', icon: List },
  ];

  const handleAcceptAITask = (aiTask) => {
    const newTask = {
      ...aiTask,
      id: tasks.length + 1,
      name: `T-${1000 + tasks.length + 1}`,
      status: 'Backlog',
      assignee: 'Unassigned',
      project: 'Backlog',
      exp_start_date: '2024-05-15',
      exp_end_date: '2024-05-25'
    };
    setTasks([newTask, ...tasks]);
  };

  const handleBulkUpdate = (ids, updates) => {
    setTasks(prev => prev.map(task => {
      if (ids.includes(task.id)) {
        return {
          ...task,
          assignee: updates.assignee || task.assignee,
          priority: updates.priority || task.priority
        };
      }
      return task;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 fixed lg:relative z-20 transition-all duration-300 h-screen overflow-hidden ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-200 transform rotate-3">IA</div>
            {isSidebarOpen && <span className="font-black text-xl tracking-tighter text-slate-900">InfintrixAtlas</span>}
          </div>
        </div>
        
        <nav className="px-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 scale-105' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={22} className={item.highlight && activeTab !== item.id ? 'text-indigo-500 animate-pulse' : ''} />
              {isSidebarOpen && (
                <span className="text-sm flex items-center justify-between flex-1">
                  {item.label}
                  {item.highlight && <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-black ${activeTab === item.id ? 'bg-indigo-400 text-white' : 'bg-indigo-100 text-indigo-700'}`}>AI</span>}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-8">
           <div className={`bg-slate-50 rounded-2xl p-4 flex items-center space-x-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">PM</div>
              <div>
                 <div className="text-xs font-black text-slate-900">Lead Manager</div>
                 <div className="text-[10px] text-slate-400">Upgrade Available</div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Module / {activeTab}</h1>
            <p className="text-2xl font-black text-slate-900 tracking-tight">Project Workspace</p>
          </div>
          
          <div className="flex items-center space-x-6">
             <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
                <Search size={18} className="text-slate-400 mr-2" />
                <input type="text" placeholder="Global Search..." className="bg-transparent border-none text-sm focus:ring-0 w-48 font-medium" />
             </div>
             <div className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer shadow-sm relative">
                <AlertCircle size={24} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
             </div>
          </div>
        </header>

        <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Projects', val: projects.length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active Tasks', val: tasks.length, icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Avg Progress', val: '42%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Team Members', val: TEAM_MEMBERS.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
                      <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                        <stat.icon size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-400">{stat.label}</div>
                        <div className="text-2xl font-black text-slate-900">{stat.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card title="Quick Overview" className="lg:col-span-2">
                     <div className="space-y-6">
                        {projects.slice(0, 3).map(p => (
                          <div key={p.name} className="flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                   <Briefcase size={24} />
                                </div>
                                <div>
                                   <div className="font-bold text-slate-900">{p.project_name}</div>
                                   <div className="text-xs text-slate-400">{p.project_type}</div>
                                </div>
                             </div>
                             <div className="flex items-center space-x-8">
                                <Badge className={PROJECT_STATUS_COLORS[p.status]}>{p.status}</Badge>
                                <div className="text-right">
                                   <div className="text-xs font-black text-slate-800">{p.percent_complete}%</div>
                                   <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1">
                                      <div className="h-full bg-indigo-500 rounded-full" style={{width: `${p.percent_complete}%`}} />
                                   </div>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </Card>
                  <Card title="Recent Activity" className="bg-slate-900 text-white border-none">
                     <div className="space-y-6">
                        {[
                          { text: "AI generated 4 new tasks for App Dev", time: "2m ago" },
                          { text: "Bulk assigned 12 tasks to Mike Ross", time: "1h ago" },
                          { text: "Project Migration marked Completed", time: "4h ago" },
                        ].map((act, i) => (
                          <div key={i} className="flex items-start space-x-3">
                             <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5" />
                             <div>
                                <div className="text-sm font-medium text-slate-100">{act.text}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{act.time}</div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </Card>
                </div>
              </div>
            )}
            
            {activeTab === 'ai-gen' && <AIGeneratorView onAcceptTask={handleAcceptAITask} />}
            {activeTab === 'bulk-assign' && <BulkAssignView tasks={tasks} onBulkUpdate={handleBulkUpdate} />}
            {activeTab === 'kanban' && <KanbanView tasks={tasks} />}
            {activeTab === 'gantt' && <GanttView tasks={tasks} />}
            {activeTab === 'tree' && <TreeView projects={projects} tasks={tasks} />}
            
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Project Hub</h2>
                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-indigo-100">
                    <Plus size={20} />
                    <span>Create Project</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {projects.map(p => (
                     <Card key={p.name}>
                        <div className="flex justify-between items-start mb-4">
                           <Badge className={PROJECT_STATUS_COLORS[p.status]}>{p.status}</Badge>
                           <button className="text-slate-300 hover:text-slate-600"><MoreVertical size={20}/></button>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{p.project_name}</h3>
                        <p className="text-xs text-slate-400 mb-6">{p.name} • {p.project_type}</p>
                        
                        <div className="space-y-2 mb-6">
                           <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span>Completion</span>
                              <span>{p.percent_complete}%</span>
                           </div>
                           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: `${p.percent_complete}%`}} />
                           </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                           <div className="flex -space-x-2">
                              {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">JD</div>
                              ))}
                           </div>
                           <div className="flex items-center text-[10px] text-slate-400 font-bold space-x-1 uppercase tracking-widest">
                              <Calendar size={12} />
                              <span>{p.expected_end_date}</span>
                           </div>
                        </div>
                     </Card>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">All Tasks</h2>
                  <div className="flex space-x-3">
                     <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                        <Filter size={20} />
                     </button>
                     <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg">
                        <Plus size={20} />
                        <span>Add Task</span>
                     </button>
                  </div>
                </div>
                <Card className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/50 border-b border-slate-100">
                          <tr>
                             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Subject</th>
                             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Project</th>
                             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                             <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Deadline</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {tasks.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="p-6">
                                  <div className="font-bold text-slate-900">{t.subject}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{t.name}</div>
                               </td>
                               <td className="p-6 text-sm font-medium text-slate-600">{t.project}</td>
                               <td className="p-6">
                                  <Badge className={TASK_STATUS_COLORS[t.status]}>{t.status}</Badge>
                               </td>
                               <td className="p-6">
                                  <div className="flex items-center space-x-2">
                                     <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{t.assignee?.charAt(0)}</div>
                                     <span className="text-xs font-bold text-slate-700">{t.assignee}</span>
                                  </div>
                               </td>
                               <td className="p-6 text-xs font-bold text-slate-400">{t.exp_end_date}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}