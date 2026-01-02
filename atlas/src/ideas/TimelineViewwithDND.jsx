import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  useDraggable, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  Briefcase, 
  AlertCircle,
  Maximize2,
  Settings,
  List,
  Layers,
  CheckSquare,
  GitGraph,
  TrendingUp,
  Link as LinkIcon,
  X,
  GripVertical
} from 'lucide-react';

// --- Configuration & Constants ---

const DAY_WIDTH = 60; 
const SIDEBAR_WIDTH = 320;
const ROW_HEIGHT = 80;
const DAYS_VISIBLE = 30;

const STATUS_COLORS = {
  'Backlog': 'bg-slate-400',
  'Open': 'bg-blue-500',
  'Working': 'bg-amber-500',
  'Pending Review': 'bg-purple-500',
  'Completed': 'bg-emerald-500',
};

const INITIAL_TASKS = [
  { id: 'TASK-001', subject: 'Initial Wireframes', status: 'Completed', start: 1, duration: 4, assignee: 'AR' },
  { id: 'TASK-002', subject: 'Backend API Setup', status: 'Working', start: 4, duration: 8, assignee: 'JD' },
  { id: 'TASK-003', subject: 'Database Schema', status: 'Open', start: 6, duration: 5, assignee: 'SC' },
  { id: 'TASK-004', subject: 'Auth Integration', status: 'Backlog', start: 12, duration: 6, assignee: 'MR' },
  { id: 'TASK-005', subject: 'Dashboard UI', status: 'Working', start: 9, duration: 10, assignee: 'JS' },
  { id: 'TASK-006', subject: 'Security Audit', status: 'Open', start: 16, duration: 4, assignee: 'AR' },
];

const INITIAL_LINKS = [
  { from: 'TASK-001', to: 'TASK-002' },
  { from: 'TASK-002', to: 'TASK-004' }
];

// --- Helper: SVG Dependency Lines ---

const DependencyLines = ({ tasks, links, activeLink }) => {
  return (
    <svg className="absolute inset-0 pointer-events-none z-0" style={{ width: '100%', height: '100%' }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366F1" />
        </marker>
      </defs>
      
      {links.map((link, idx) => {
        const fromTask = tasks.find(t => t.id === link.from);
        const toTask = tasks.find(t => t.id === link.to);
        if (!fromTask || !toTask) return null;

        const x1 = fromTask.start * DAY_WIDTH + fromTask.duration * DAY_WIDTH;
        const y1 = tasks.indexOf(fromTask) * ROW_HEIGHT + 40 + 64; 
        const x2 = toTask.start * DAY_WIDTH;
        const y2 = tasks.indexOf(toTask) * ROW_HEIGHT + 40 + 64;

        const midX = x1 + (x2 - x1) / 2;
        const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

        return (
          <path key={idx} d={path} stroke="#CBD5E1" strokeWidth="2" fill="none" markerEnd="url(#arrow)" strokeDasharray="4 2" />
        );
      })}

      {activeLink && (
        <path 
          d={`M ${activeLink.x1} ${activeLink.y1} C ${activeLink.x1 + (activeLink.x2 - activeLink.x1)/2} ${activeLink.y1}, ${activeLink.x1 + (activeLink.x2 - activeLink.x1)/2} ${activeLink.y2}, ${activeLink.x2} ${activeLink.y2}`}
          stroke="#6366F1"
          strokeWidth="3"
          fill="none"
          markerEnd="url(#arrow-active)"
          className="animate-pulse"
        />
      )}
    </svg>
  );
};

// --- Draggable Task Component ---

const DraggableTask = ({ task, onResizeStart, onLinkStart, onHoverChange, isLinking, isHoveredTarget }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // Manually restrict to horizontal axis and handle snapping/visuals
  const style = transform ? {
    transform: `translate3d(${transform.x}px, 0, 0)`,
    zIndex: isDragging ? 50 : 10,
  } : undefined;

  return (
    <div className="h-20 flex items-center relative border-b border-slate-50">
      <div 
        ref={setNodeRef}
        style={{ 
          left: task.start * DAY_WIDTH, 
          width: task.duration * DAY_WIDTH,
          ...style
        }}
        className={`h-10 rounded-2xl shadow-sm absolute group transition-shadow flex items-center px-4 
          ${STATUS_COLORS[task.status]} 
          ${isHoveredTarget ? 'ring-4 ring-indigo-400 ring-offset-2 scale-105' : ''}
          ${isDragging ? 'shadow-xl ring-2 ring-white/50 cursor-grabbing' : 'cursor-grab'}`}
        onMouseEnter={() => onHoverChange(task.id)}
        onMouseLeave={() => onHoverChange(null)}
      >
        {/* Drag Handle Area */}
        <div {...attributes} {...listeners} className="absolute inset-0 z-0 rounded-2xl" />
 {/* Resize Handle (Right Side) */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/20 transition-colors rounded-r-2xl z-20 flex items-center justify-center"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e, task);
          }}
        >
          <div className="w-1 h-4 bg-white/40 rounded-full" />
        </div>
        <div className="flex items-center justify-between w-full overflow-hidden pointer-events-none relative z-10">
          <span className="text-[9px] font-black text-white uppercase tracking-widest truncate">{task.subject}</span>
        </div>

        {/* Resize Handle (Right Side) */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/20 transition-colors rounded-r-2xl z-20 flex items-center justify-center"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e, task);
          }}
        >
          <div className="w-1 h-4 bg-white/40 rounded-full" />
        </div>

        {/* Link Ports */}
        {/* Source Port (Right) */}
        <div 
          onMouseDown={(e) => {
            e.stopPropagation();
            onLinkStart(e, task);
          }}
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md flex items-center justify-center cursor-crosshair z-30 hover:border-indigo-500"
        >
          <div className="w-1.5 h-1.5 bg-slate-300 group-hover:bg-indigo-500 rounded-full" />
        </div>

        {/* Target Indicator (Left) */}
        <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full transition-all ${isLinking ? 'opacity-100 scale-125' : 'opacity-0'} border-indigo-400 z-30`}>
           <div className="w-1 h-1 bg-indigo-400 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [linking, setLinking] = useState(null); 
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [resizing, setResizing] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  }));
  
  const timelineRef = useRef(null);
  const gridRef = useRef(null);

  // --- Handlers: DnD Kit Movement ---

  const handleDragEnd = (event) => {
    const { active, delta } = event;
    const dayDiff = Math.round(delta.x / DAY_WIDTH);
    
    if (dayDiff !== 0) {
      setTasks(prev => prev.map(t => 
        t.id === active.id ? { ...t, start: Math.max(0, t.start + dayDiff) } : t
      ));
    }
  };

  // --- Handlers: Custom Resizing ---

  const startResizing = (e, task) => {
    setResizing({ id: task.id, initialX: e.clientX, initialDuration: task.duration });
  };

  // --- Handlers: Linking Engine ---

  const startLinking = (e, task) => {
    const x1 = task.start * DAY_WIDTH + task.duration * DAY_WIDTH;
    const y1 = tasks.indexOf(task) * ROW_HEIGHT + 40 + 64;
    setLinking({ fromId: task.id, x1, y1, x2: x1, y2: y1 });
  };

  const handleGlobalMouseMove = useCallback((e) => {
    if (resizing) {
      const dx = e.clientX - resizing.initialX;
      const dayDiff = Math.round(dx / DAY_WIDTH);
      setTasks(prev => prev.map(t => 
        t.id === resizing.id ? { ...t, duration: Math.max(1, resizing.initialDuration + dayDiff) } : t
      ));
    }

    if (linking && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const scrollTop = timelineRef.current.scrollTop;
      setLinking(prev => ({
        ...prev,
        x2: e.clientX - rect.left + scrollLeft - SIDEBAR_WIDTH,
        y2: e.clientY - rect.top + scrollTop
      }));
    }
  }, [resizing, linking, tasks]);

  const handleGlobalMouseUp = useCallback(() => {
    if (linking && hoveredTaskId && linking.fromId !== hoveredTaskId) {
      const exists = links.some(l => l.from === linking.fromId && l.to === hoveredTaskId);
      if (!exists) setLinks(prev => [...prev, { from: linking.fromId, to: hoveredTaskId }]);
    }
    setResizing(null);
    setLinking(null);
  }, [linking, hoveredTaskId, links]);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8 select-none">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
              <GitGraph size={24} className="text-indigo-600 transform rotate-90" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900">Task Timeline</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-xs">Interactive Gantt</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-indigo-500 text-xs">PROJ-2024-08X</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setLinks([])} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-red-500 transition-all">
               Reset Links
             </button>
             <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-100">
                <Plus size={20} />
                <span>New Task</span>
             </button>
          </div>
        </div>

        {/* Gantt Area */}
        <DndContext 
          sensors={sensors} 
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden flex flex-col h-[750px] relative">
            
            <div className="overflow-auto relative flex-1 custom-scrollbar" ref={timelineRef}>
              
              <div ref={gridRef} className="absolute inset-0 z-0 pointer-events-none" style={{ width: DAYS_VISIBLE * DAY_WIDTH + SIDEBAR_WIDTH }}>
                <DependencyLines tasks={tasks} links={links} activeLink={linking} />
              </div>

              {/* Grid Header */}
              <div className="flex bg-slate-50 border-b border-slate-100 sticky top-0 z-20">
                <div className="w-80 flex-shrink-0 p-5 border-r border-slate-200 bg-white flex items-center justify-between">
                  <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Resources</span>
                  <List size={14} className="text-slate-300" />
                </div>
                <div className="flex">
                  {Array.from({ length: DAYS_VISIBLE }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 border-r border-slate-100 flex flex-col items-center justify-center h-16 bg-white/50" style={{ width: DAY_WIDTH }}>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">May</span>
                      <span className={`text-sm font-black ${i === 4 ? 'text-indigo-600' : 'text-slate-900'}`}>{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-h-full">
                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white sticky left-0 z-10">
                  {tasks.map((task) => (
                    <div key={task.id} className="h-20 p-5 border-b border-slate-50 flex items-center justify-between group hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 border border-transparent transition-all">
                          <CheckSquare size={16} />
                        </div>
                        <div className="max-w-[180px]">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{task.subject}</h4>
                          <span className="text-[10px] font-black text-slate-300 font-mono tracking-tighter uppercase">{task.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline Grid */}
                <div className="relative flex-1 bg-white">
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: DAYS_VISIBLE }).map((_, i) => <div key={i} className="h-full border-r border-slate-50/50" style={{ width: DAY_WIDTH }} />)}
                  </div>

                  {tasks.map((task) => (
                    <DraggableTask 
                      key={task.id} 
                      task={task} 
                      onResizeStart={startResizing}
                      onLinkStart={startLinking}
                      onHoverChange={setHoveredTaskId}
                      isLinking={!!linking}
                      isHoveredTarget={hoveredTaskId === task.id && linking && linking.fromId !== task.id}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between z-30">
              <div className="flex items-center gap-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Logic Links</span>
                  <span className="text-xl font-black tracking-tighter">{links.length} Active</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Efficiency</span>
                  <span className="text-xl font-black tracking-tighter">94%</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                   <TrendingUp size={16} className="text-emerald-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Health: Optimized</span>
                 </div>
                 <div className="flex -space-x-3">
                    {['AR', 'JD', 'SC', 'MR'].map((initials, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black uppercase text-slate-300">{initials}</div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}