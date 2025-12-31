import React, { useState, useEffect } from 'react';
import { 
  X, 
  Maximize2, 
  Share2, 
  MoreHorizontal, 
  Eye, 
  Lock, 
  Plus, 
  Settings, 
  Check, 
  ChevronDown, 
  User, 
  Zap, 
  Monitor, 
  GitBranch,
  Filter,
  ArrowUpRight,
  Search,
  Layout,
  Clock,
  ChevronRight,
  HelpCircle,
  Bell,
  Menu,
  MoreVertical,
  AlertCircle,
  Bookmark
} from 'lucide-react';
import Card from '../components/ui/Card';
const IssueCard = ({ issue, onClick, onDragStart }) => (
  <div 
    draggable
    onDragStart={(e) => onDragStart(e, issue.id)}
    onClick={() => onClick(issue)}
    className="bg-white p-3 rounded shadow-sm border border-slate-200 mb-2 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-all group animate-in slide-in-from-top-1 duration-200"
  >
    <p className="text-sm text-slate-800 mb-3 line-clamp-2 leading-relaxed group-hover:text-blue-600 select-none">{issue.title}</p>
    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center space-x-2">
        {issue.type === 'story' ? (
          <div className="w-3.5 h-3.5 bg-green-500 rounded-sm flex items-center justify-center"><Bookmark size={8} className="text-white" fill="white" /></div>
        ) : (
          <div className="w-3.5 h-3.5 bg-red-500 rounded-sm flex items-center justify-center"><AlertCircle size={8} className="text-white" /></div>
        )}
        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">{issue.id}</span>
      </div>
      <div className={`w-6 h-6 rounded-full ${issue.assigneeColor || 'bg-slate-200'} text-white flex items-center justify-center text-[9px] font-bold shadow-sm`}>
        {issue.assigneeInitials}
      </div>
    </div>
  </div>
);

const Column = ({ title, issues, onCardClick, onDragStart, onDrop }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    setIsOver(false);
    onDrop(e, title);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 min-w-[280px] max-w-[320px] rounded-lg p-3 flex flex-col h-full transition-colors duration-200 ${
        isOver ? 'bg-blue-50' : 'bg-slate-100/50'
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
          {title} <span className="ml-2 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{issues.length}</span>
        </h3>
        <div className="flex space-x-1">
          <button className="p-1 hover:bg-slate-200 rounded text-slate-500"><Plus size={14} /></button>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-500"><MoreHorizontal size={14} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {issues.map(issue => (
          <IssueCard 
            key={issue.id} 
            issue={issue} 
            onClick={onCardClick} 
            onDragStart={onDragStart}
          />
        ))}
        <button className="w-full text-left py-2 px-3 text-slate-500 hover:bg-slate-200 rounded text-sm flex items-center transition-colors">
          <Plus size={16} className="mr-2" /> Create Task
        </button>
      </div>
    </div>
  );
};


export default function KanbanView() {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issues, setIssues] = useState([
    { id: 'IT-1', title: 'Connect to ERPNext API instead of WordPress', status: 'To Do', assignee: 'John Doe', assigneeInitials: 'JD', assigneeColor: 'bg-indigo-500', type: 'story' },
    { id: 'IT-2', title: 'Implement dynamic dashboard widgets', status: 'To Do', assignee: 'Muqeet Mughal', assigneeInitials: 'MM', assigneeColor: 'bg-cyan-600', type: 'story' },
    { id: 'IT-3', title: 'Fix CSS layout break on Safari 14', status: 'In Progress', assignee: 'Sara Khan', assigneeInitials: 'SK', assigneeColor: 'bg-rose-500', type: 'bug' },
    { id: 'IT-4', title: 'Setup CI/CD pipeline with GitHub Actions', status: 'In Progress', assignee: 'JD', assigneeInitials: 'JD', assigneeColor: 'bg-indigo-500', type: 'story' },
    { id: 'IT-5', title: 'Convert Blog to ERPnext instead of wordpress api', status: 'Done', assignee: 'MM', assigneeInitials: 'MM', assigneeColor: 'bg-cyan-600', type: 'story' },
    { id: 'IT-6', title: 'Database optimization for large queries', status: 'Done', assignee: 'SK', assigneeInitials: 'SK', assigneeColor: 'bg-rose-500', type: 'story' },
  ]);

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const handleDragStart = (e, issueId) => {
    e.dataTransfer.setData('issueId', issueId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    const issueId = e.dataTransfer.getData('issueId');
    setIssues(prevIssues => 
      prevIssues.map(issue => 
        issue.id === issueId ? { ...issue, status: targetStatus } : issue
      )
    );
  };

  return (
     <Card className="p-0">
 
      {/* --- Main Board Content --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
 
        {/* Board Columns */}
        <div className="flex-1 px-6 pb-6 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="flex space-x-4 h-full">
            <Column 
              title="To Do" 
              issues={issues.filter(i => i.status === 'To Do')} 
              onCardClick={handleIssueClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
            <Column 
              title="In Progress" 
              issues={issues.filter(i => i.status === 'In Progress')} 
              onCardClick={handleIssueClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
            <Column 
              title="Done" 
              issues={issues.filter(i => i.status === 'Done')} 
              onCardClick={handleIssueClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>
        </div>
      </main>

 

      {/* Issue Detail Modal Overlay */}
   
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
      `}</style>
    </Card>
  );
}