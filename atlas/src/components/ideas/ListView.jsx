import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronRight, 
  Calendar, 
  CheckSquare, 
  Plus, 
  UserPlus, 
  Trash2, 
  Download, 
  LayoutList,
  ArrowUpDown,
  Check,
  X,
  Briefcase,
  AlertCircle,
  Hash,
  Settings,
  ChevronDown,
  GripVertical,
  RotateCcw,
  Activity,
  Tag
} from 'lucide-react';

// --- Constants ---

const ItemTypes = {
  TASK: 'task'
};

const STATUS_CONFIG = {
  'Backlog': 'bg-slate-100 text-slate-600 border-slate-200',
  'Open': 'bg-blue-50 text-blue-600 border-blue-100',
  'Working': 'bg-amber-50 text-amber-700 border-amber-100',
  'Pending Review': 'bg-purple-50 text-purple-700 border-purple-100',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const PRIORITY_CONFIG = {
  'Urgent': { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
  'High': { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle },
  'Medium': { color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Hash },
  'Low': { color: 'text-slate-400', bg: 'bg-slate-50', icon: Hash },
};

const INITIAL_DATA = [
  { id: 'TASK-2024-001', subject: 'Integrate Stripe API for Subscriptions', project: 'PROJ-001', status: 'Working', priority: 'Urgent', assignee: 'Alex Rivera', date: '2024-05-12' },
  { id: 'TASK-2024-002', subject: 'Fix Header Alignment on Mobile', project: 'PROJ-001', status: 'Pending Review', priority: 'Medium', assignee: 'Sarah Chen', date: '2024-05-14' },
  { id: 'TASK-2024-003', subject: 'Draft Project Charter', project: 'PROJ-002', status: 'Open', priority: 'High', assignee: 'John Doe', date: '2024-05-15' },
  { id: 'TASK-2024-004', subject: 'Setup Redis Cache Layer', project: 'PROJ-003', status: 'Backlog', priority: 'Urgent', assignee: 'Unassigned', date: '2024-05-20' },
  { id: 'TASK-2024-005', subject: 'UI Consistency Audit', project: 'PROJ-001', status: 'Completed', priority: 'Low', assignee: 'Mike Ross', date: '2024-04-30' },
  { id: 'TASK-2024-006', subject: 'Legal Compliance Check', project: 'PROJ-004', status: 'Open', priority: 'Medium', assignee: 'Jane Smith', date: '2024-05-18' },
  { id: 'TASK-2024-007', subject: 'Refactor Auth Middleware', project: 'PROJ-003', status: 'Working', priority: 'High', assignee: 'Alex Rivera', date: '2024-05-22' },
  { id: 'TASK-2024-008', subject: 'Database Migration Script', project: 'PROJ-003', status: 'Working', priority: 'Urgent', assignee: 'John Doe', date: '2024-05-25' },
];

// --- Components ---

const Badge = ({ children, className }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border transition-all ${className}`}>
    {children}
  </span>
);

const Avatar = ({ name }) => (
  <div className="flex items-center gap-2 group cursor-pointer">
    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      {name?.charAt(0) || '?'}
    </div>
    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{name}</span>
  </div>
);

const DraggableRow = ({ item, isSelected, onToggleSelect }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: item.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item.id]);

  const prio = PRIORITY_CONFIG[item.priority];
  const PrioIcon = prio.icon;

  return (
    <tr 
      ref={drag}
      className={`group transition-all cursor-grab active:cursor-grabbing border-b border-slate-50 ${isDragging ? 'opacity-20 bg-slate-100' : 'bg-white hover:bg-indigo-50/30'} ${isSelected ? 'bg-indigo-50/50' : ''}`}
    >
      <td className="p-5 text-center">
        <input 
          type="checkbox" 
          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
        />
      </td>
      <td className="p-5">
        <span className="text-[11px] font-bold text-slate-400 font-mono group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
          {item.id}
        </span>
      </td>
      <td className="p-5">
        <div className="flex flex-col max-w-xs">
          <span className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.subject}</span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
            <Briefcase size={10} />
            {item.project}
          </span>
        </div>
      </td>
      <td className="p-5">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl w-fit border ${prio.bg} ${prio.color} border-transparent`}>
          <PrioIcon size={12} />
          <span className="text-[10px] font-black tracking-tight">{item.priority}</span>
        </div>
      </td>
      <td className="p-5">
        <Avatar name={item.assignee} />
      </td>
      <td className="p-5 text-right">
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-700">{item.date}</span>
          <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5 tracking-tighter">Scheduled</span>
        </div>
      </td>
      <td className="p-5 text-center">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <GripVertical size={14} className="text-slate-300" />
          <button className="text-slate-300 hover:text-slate-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const DroppableStatusSection = ({ status, items, selectedIds, onToggleSelect, onDropItem, searchQuery }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item) => onDropItem(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [status, onDropItem]);

  if (items.length === 0 && searchQuery) return null;

  return (
    <tbody 
      ref={drop} 
      className={`transition-colors duration-200 border-l-4 ${isOver ? 'bg-indigo-50/50 border-indigo-500' : 'border-transparent'}`}
    >
      <tr className={`sticky top-0 z-10 backdrop-blur-sm border-y border-slate-100/50 ${isOver ? 'bg-indigo-100/60' : 'bg-slate-50/80'}`}>
        <td colSpan={7} className="p-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-4 rounded-full ${STATUS_CONFIG[status].split(' ')[1].replace('text-', 'bg-')}`} />
              <Badge className={`${STATUS_CONFIG[status]} border-none shadow-sm`}>
                {status}
              </Badge>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                {items.length} {items.length === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isOver && (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full animate-pulse shadow-lg">
                  <span className="text-[9px] font-black uppercase tracking-widest">Drop Here</span>
                </div>
              )}
              <button className="text-slate-300 hover:text-slate-500 transition-colors">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {items.length > 0 ? (
        items.map((item) => (
          <DraggableRow 
            key={item.id} 
            item={item} 
            isSelected={selectedIds.includes(item.id)} 
            onToggleSelect={onToggleSelect} 
          />
        ))
      ) : (
        <tr>
          <td colSpan={7} className="p-10 text-center bg-white/40">
             <div className={`mx-auto max-w-sm py-4 border-2 border-dashed rounded-3xl transition-all ${isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-100 bg-transparent'}`}>
               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">
                 {isOver ? 'Release to Move' : `No tasks in ${status}`}
               </span>
             </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};

// --- Filter Dropdown Component ---

const FilterDropdown = ({ isOpen, onClose, filters, onToggleFilter, onReset }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-[28px] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-indigo-600" />
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Active Filters</h3>
        </div>
        <button 
          onClick={onReset}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
          title="Reset All"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Workflow Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Activity size={12} />
            <span>Workflow Status</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(STATUS_CONFIG).map(status => (
              <button
                key={status}
                onClick={() => onToggleFilter('status', status)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  filters.status.includes(status)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Tag size={12} />
            <span>Priority Level</span>
          </div>
          <div className="space-y-1">
            {Object.keys(PRIORITY_CONFIG).map(prio => (
              <button
                key={prio}
                onClick={() => onToggleFilter('priority', prio)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group ${
                  filters.priority.includes(prio)
                    ? 'bg-indigo-50/80 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    filters.priority.includes(prio) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'
                  }`}>
                    {filters.priority.includes(prio) && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-xs font-bold">{prio}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[prio].color.replace('text-', 'bg-')}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// --- Main Application ---

const ListApp = () => {
  const [items, setItems] = useState(INITIAL_DATA);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
  });

  const filterButtonRef = useRef(null);

  const statuses = Object.keys(STATUS_CONFIG);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filters.status.length === 0 || filters.status.includes(item.status);
      const matchesPriority = filters.priority.length === 0 || filters.priority.includes(item.priority);

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [items, searchQuery, filters]);

  const moveTask = useCallback((id, newStatus) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleToggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const resetFilters = () => setFilters({ status: [], priority: [] });

  const handleBulkAction = (action) => {
    if (action === 'delete') {
      setItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
    }
    setSelectedIds([]);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterButtonRef.current && !filterButtonRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
              <LayoutList size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900">Task Management</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-xs">Interactive List View</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-indigo-500 text-xs">{filteredItems.length} Records Shown</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={16} />
              <span>Export</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Plus size={18} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search subject, ID..." 
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative" ref={filterButtonRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${
                  isFilterOpen || filters.status.length > 0 || filters.priority.length > 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Filter size={16} />
                <span>Filters</span>
                {(filters.status.length > 0 || filters.priority.length > 0) && (
                  <div className="w-5 h-5 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black ml-1 shadow-sm">
                    {filters.status.length + filters.priority.length}
                  </div>
                )}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              <FilterDropdown 
                isOpen={isFilterOpen} 
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onToggleFilter={handleToggleFilter}
                onReset={resetFilters}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-100 pl-4 hidden md:flex">
             <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                <ArrowUpDown size={18} />
             </button>
             <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                <Settings size={18} />
             </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(filters.status.length > 0 || filters.priority.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">Filtering by:</span>
            {filters.status.map(s => (
              <div key={s} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-700 uppercase">
                <span>Status: {s}</span>
                <X size={12} className="cursor-pointer hover:text-indigo-900" onClick={() => handleToggleFilter('status', s)} />
              </div>
            ))}
            {filters.priority.map(p => (
              <div key={p} className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-black text-rose-700 uppercase">
                <span>Priority: {p}</span>
                <X size={12} className="cursor-pointer hover:text-rose-900" onClick={() => handleToggleFilter('priority', p)} />
              </div>
            ))}
            <button 
              onClick={resetFilters}
              className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest ml-2 px-2 py-1 hover:bg-slate-100 rounded-lg transition-all"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Table Body */}
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      onChange={(e) => setSelectedIds(e.target.checked ? filteredItems.map(i => i.id) : [])}
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    />
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Ref</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Deadline</th>
                  <th className="p-5 w-10"></th>
                </tr>
              </thead>
              {statuses.map(status => (
                <DroppableStatusSection 
                  key={status} 
                  status={status} 
                  items={filteredItems.filter(item => item.status === status)}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onDropItem={moveTask}
                  searchQuery={searchQuery}
                />
              ))}
            </table>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-[32px] p-4 flex items-center gap-8 shadow-2xl animate-in slide-in-from-bottom-20 z-50 ring-1 ring-white/10 pr-6">
            <div className="px-8 border-r border-white/10 flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected</span>
              <span className="text-xl font-black">{selectedIds.length} <span className="text-sm text-white/50 italic">Tasks</span></span>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all">
                <UserPlus size={18} />
                <span>Assign</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all text-purple-400">
                <Check size={18} />
                <span>Complete</span>
              </button>
              <div className="w-px h-8 bg-white/10 mx-2" />
              <button 
                onClick={() => handleBulkAction('delete')}
                className="flex items-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-sm font-bold transition-all"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>

            <button onClick={() => setSelectedIds([])} className="ml-4 p-2 rounded-full hover:bg-white/10 text-slate-400 transition-all">
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ListApp />
    </DndProvider>
  );
}