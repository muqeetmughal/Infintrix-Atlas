import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Link as LinkIcon, 
  Users, 
  Save, 
  Send,
  Zap,
  Kanban,
  History,
  Layout
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Mock Data & Constants ---

const PROJECTS = [
  { id: 'PROJ-001', name: 'Website Redesign', mode: 'Scrum', cycle: 'Sprint 12' },
  { id: 'PROJ-002', name: 'Mobile App Dev', mode: 'Kanban', cycle: null },
];

const SUGGESTIONS = {
  yesterday: [
    { id: 'S1', text: 'Refactored auth middleware logic', taskId: 'TASK-101' },
    { id: 'S2', text: 'Fixed header overflow on mobile devices', taskId: 'TASK-102' }
  ],
  today: [
    { id: 'S3', text: 'Implement Stripe webhook listeners', taskId: 'TASK-103' },
    { id: 'S4', text: 'Document API endpoints in Swagger', taskId: 'TASK-104' }
  ]
};

const TEAM_STANDUPS = [
  {
    user: 'Alex Rivera',
    status: 'Submitted',
    blockers: [{ id: 'B1', text: 'API Gateway timeout issues in staging', taskId: 'TASK-501' }],
    yesterday: [{ id: 'Y1', text: 'Finished auth refactor' }],
    today: [{ id: 'T1', text: 'Working on Stripe integration' }]
  },
  {
    user: 'Sarah Chen',
    status: 'Submitted',
    blockers: [],
    yesterday: [{ id: 'Y2', text: 'Completed UI Audit' }],
    today: [{ id: 'T2', text: 'Designing Checkout flow' }]
  }
];

// --- Sub-Components ---

const StandupEntryRow = ({ 
  entry, 
  onUpdate, 
  onRemove, 
  isSortable = false, 
  readOnly = false 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: entry.id, disabled: !isSortable || readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 group transition-all ${readOnly ? 'opacity-80' : 'hover:border-indigo-200 shadow-sm'}`}
    >
      {isSortable && !readOnly && (
        <div {...attributes} {...listeners} className="mt-1.5 text-slate-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing">
          <Zap size={14} />
        </div>
      )}
      <div className="flex-1 space-y-2">
        <textarea
          readOnly={readOnly}
          className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 resize-none placeholder:text-slate-300"
          value={entry.text}
          onChange={(e) => onUpdate(entry.id, { text: e.target.value })}
          placeholder="What happened?..."
          rows={1}
        />
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 disabled:opacity-50" disabled={readOnly}>
            <LinkIcon size={12} />
            {entry.taskId || 'Link Task'}
          </button>
        </div>
      </div>
      {!readOnly && (
        <button onClick={() => onRemove(entry.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

const StandupSection = ({ 
  title, 
  icon: Icon, 
  entries, 
  onUpdate, 
  onRemove, 
  onAdd, 
  isToday = false, 
  isBlocker = false,
  readOnly = false 
}) => {
  return (
    <section className={`space-y-4 p-6 rounded-[32px] border transition-all ${isBlocker ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isBlocker ? 'text-rose-600' : 'text-slate-400'}`}>
          <Icon size={14} />
          {title}
        </h3>
        <span className="text-[10px] font-black text-slate-300 uppercase">{entries.length} Items</span>
      </div>

      <div className="space-y-3">
        {isToday && !readOnly ? (
          <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {entries.map(entry => (
              <StandupEntryRow key={entry.id} entry={entry} onUpdate={onUpdate} onRemove={onRemove} isSortable />
            ))}
          </SortableContext>
        ) : (
          entries.map(entry => (
            <StandupEntryRow key={entry.id} entry={entry} onUpdate={onUpdate} onRemove={onRemove} readOnly={readOnly} />
          ))
        )}

        {!readOnly && (
          <button 
            onClick={onAdd}
            className={`w-full py-3 border-2 border-dashed rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isBlocker ? 'border-rose-200 text-rose-400 hover:bg-rose-100/50' : 'border-slate-200 text-slate-400 hover:bg-white hover:border-indigo-200 hover:text-indigo-500'}`}
          >
            <Plus size={14} />
            Add {title.slice(0, -1)}
          </button>
        )}
      </div>
    </section>
  );
};

const StandupHeader = ({ project, status, onProjectChange }) => (
  <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">Daily Standup</h1>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status === 'Submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
          {status}
        </span>
      </div>
      <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
        <Calendar size={14} />
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>

    <div className="flex items-center gap-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Current Project</label>
        <select 
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={project.id}
          onChange={(e) => onProjectChange(e.target.value)}
          disabled={status === 'Submitted'}
        >
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col text-right">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Mode</span>
        <span className="text-sm font-black text-slate-900 flex items-center gap-2">
          {project.mode}
          {project.mode === 'Scrum' && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">{project.cycle}</Badge>}
        </span>
      </div>
    </div>
  </header>
);

const StandupFooter = ({ status, onSave, onSubmit }) => (
  <footer className="mt-12 p-8 bg-slate-900 rounded-[40px] text-white flex items-center justify-between shadow-2xl">
    <div className="flex items-center gap-6">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workflow State</span>
        <span className="text-sm font-black text-slate-200">{status === 'Submitted' ? 'Read-Only' : 'Awaiting Submission'}</span>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {status !== 'Submitted' && (
        <>
          <button 
            onClick={onSave}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Save size={16} />
            Save Draft
          </button>
          <button 
            onClick={onSubmit}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Send size={16} />
            Submit Standup
          </button>
        </>
      )}
      {status === 'Submitted' && (
        <span className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
          <CheckCircle2 size={18} />
          Submitted Successfully
        </span>
      )}
    </div>
  </footer>
);

// --- Pages ---

const DailyStandupPage = () => {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [status, setStatus] = useState('Draft');
  const [entries, setEntries] = useState({
    yesterday: [...SUGGESTIONS.yesterday],
    today: [...SUGGESTIONS.today],
    blockers: []
  });

  const activeProject = useMemo(() => PROJECTS.find(p => p.id === projectId), [projectId]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleUpdate = (section, id, updates) => {
    setEntries(prev => ({
      ...prev,
      [section]: prev[section].map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const handleRemove = (section, id) => {
    setEntries(prev => ({
      ...prev,
      [section]: prev[section].filter(e => e.id !== id)
    }));
  };

  const handleAdd = (section) => {
    const newEntry = { id: `NEW-${Date.now()}`, text: '', taskId: null };
    setEntries(prev => ({ ...prev, [section]: [...prev[section], newEntry] }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setEntries(prev => {
        const oldIndex = prev.today.findIndex(e => e.id === active.id);
        const newIndex = prev.today.findIndex(e => e.id === over.id);
        return { ...prev, today: arrayMove(prev.today, oldIndex, newIndex) };
      });
    }
  };

  const submitStandup = () => {
    // Only modified suggestions are sent? In this mock, we send current state
    setStatus('Submitted');
    console.log('Submitting Standup:', entries);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-500">
      <StandupHeader project={activeProject} status={status} onProjectChange={setProjectId} />
      
      <div className="space-y-8">
        <StandupSection 
          title="Yesterday" 
          icon={History} 
          entries={entries.yesterday} 
          onUpdate={(id, up) => handleUpdate('yesterday', id, up)} 
          onRemove={(id) => handleRemove('yesterday', id)}
          onAdd={() => handleAdd('yesterday')}
          readOnly={status === 'Submitted'}
        />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <StandupSection 
            title="Today" 
            icon={Clock} 
            isToday 
            entries={entries.today} 
            onUpdate={(id, up) => handleUpdate('today', id, up)} 
            onRemove={(id) => handleRemove('today', id)}
            onAdd={() => handleAdd('today')}
            readOnly={status === 'Submitted'}
          />
        </DndContext>

        <StandupSection 
          title="Blockers" 
          icon={AlertCircle} 
          isBlocker 
          entries={entries.blockers} 
          onUpdate={(id, up) => handleUpdate('blockers', id, up)} 
          onRemove={(id) => handleRemove('blockers', id)}
          onAdd={() => handleAdd('blockers')}
          readOnly={status === 'Submitted'}
        />
      </div>

      <StandupFooter status={status} onSave={() => {}} onSubmit={submitStandup} />
    </div>
  );
};

const TeamStandupPage = () => {
  const [expanded, setExpanded] = useState({});

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-500">
      <header className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">Team Standups</h1>
        <p className="text-sm font-bold text-slate-400">Reviewing board status for {new Date().toLocaleDateString()}</p>
      </header>

      <div className="space-y-6">
        {TEAM_STANDUPS.map((standup, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm transition-all">
            {/* User Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">{standup.user.charAt(0)}</div>
                <div>
                  <h3 className="font-black text-slate-900">{standup.user}</h3>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">{standup.status}</Badge>
                </div>
              </div>
              <button 
                onClick={() => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
                className="p-2 text-slate-400 hover:text-indigo-600"
              >
                {expanded[idx] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {/* Blockers First - Always Visible */}
            <div className="p-6 space-y-4">
              {standup.blockers.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} />
                    Active Blockers
                  </h4>
                  {standup.blockers.map(b => (
                    <div key={b.id} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-bold text-rose-700">
                      {b.text} {b.taskId && <span className="text-[10px] ml-2 opacity-60 font-mono tracking-tighter">[{b.taskId}]</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Blockers Reported</p>
              )}
            </div>

            {/* Collapsible Details */}
            {expanded[idx] && (
              <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} />
                      Yesterday
                    </h5>
                    {standup.yesterday.map(y => <p key={y.id} className="text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">{y.text}</p>)}
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} />
                      Today
                    </h5>
                    {standup.today.map(t => <p key={t.id} className="text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">{t.text}</p>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Wrapper ---

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('/pm/standup/today');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Dev Navigation (Mock Router) */}
      <nav className="fixed bottom-6 right-6 z-50 bg-white/80 backdrop-blur shadow-2xl border border-slate-200 p-2 rounded-2xl flex items-center gap-2">
        <button 
          onClick={() => setCurrentRoute('/pm/standup/today')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentRoute === '/pm/standup/today' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Daily Standup
        </button>
        <button 
          onClick={() => setCurrentRoute('/pm/standup/team')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentRoute === '/pm/standup/team' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Team View
        </button>
      </nav>

      {currentRoute === '/pm/standup/today' ? <DailyStandupPage /> : <TeamStandupPage />}
    </div>
  );
}

// --- Icons / Helpers ---
const Badge = ({ children, className }) => (
  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${className}`}>
    {children}
  </span>
);

function ChevronUp(props) {
  return <ChevronDown {...props} className={`transform rotate-180 ${props.className || ''}`} />;
}