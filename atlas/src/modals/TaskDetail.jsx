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
    ArrowUpRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFrappeGetDoc } from 'frappe-react-sdk';
const TaskDetail = () => {
    const [activeTab, setActiveTab] = useState('comments');
    const [status, setStatus] = useState('Done');
    const [isClosing, setIsClosing] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedTask = searchParams.get("selected_task") || null;

    const task_details_query = useFrappeGetDoc('Task', selectedTask || '');

    const task = task_details_query.data || {};

    // Handle escape key to close

    const onClose = () => {
        setSearchParams({});
    }
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!selectedTask) return null;

    const tabs = [
        { id: 'comments', label: 'Comments' },
        { id: 'worklog', label: 'Work log' }
    ];

    const metadata = [
        { label: 'Assignee', value: 'Assign to me', isUser: true, icon: <User size={14} className="text-gray-500" /> },
        { label: 'Labels', value: 'None', italic: true },
        { label: 'Sprint', value: 'IT Sprint 1', color: 'text-blue-600' },
        { label: 'Story point estimate', value: 'None' },
        { label: 'Reporter', value: 'Muqeet Mughal', userInitial: 'MM', bgColor: 'bg-cyan-600' }
    ];

    if (task_details_query.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">

            {/* Modal Container */}
            <div
                className="bg-white w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Navigation Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <button className="hover:bg-slate-100 px-2 py-1 rounded transition-colors">Add epic</button>
                        <span className="text-slate-300">/</span>
                        <div className="flex items-center text-blue-600 font-medium cursor-pointer hover:underline">
                            <div className="w-4 h-4 bg-blue-600 rounded-sm mr-2 flex items-center justify-center">
                                <Check size={10} className="text-white" strokeWidth={4} />
                            </div>
                            <span>{task.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-3 text-slate-500">
                        <button className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Lock issue"><Lock size={18} /></button>
                        <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors">
                            <Eye size={14} className="mr-1.5" /> 1
                        </div>
                        <button className="p-1.5 hover:bg-slate-100 rounded transition-colors"><Share2 size={18} /></button>
                        <button className="p-1.5 hover:bg-slate-100 rounded transition-colors"><MoreHorizontal size={18} /></button>
                        <button className="hidden sm:block p-1.5 hover:bg-slate-100 rounded transition-colors"><Maximize2 size={18} /></button>
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-1.5 hover:bg-slate-100 rounded transition-colors ml-1 text-slate-400 hover:text-slate-800"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

                    {/* Main Content (Left) */}
                    <main className="flex-1 p-6 sm:p-10 overflow-y-auto custom-scrollbar border-r border-slate-100">
                        <h1 className="text-2xl font-semibold mb-6 leading-tight">
                            {task.subject}
                        </h1>

                        <div className="flex space-x-2 mb-10">
                            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded transition-all active:scale-95">
                                <Plus size={20} />
                            </button>
                            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded transition-all active:scale-95">
                                <Settings size={20} />
                            </button>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-10">
                            <section>
                                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Description</h3>
                                <div className="group relative">
                                    <p className="text-slate-400 cursor-text hover:bg-slate-50 p-2 -ml-2 rounded transition-colors">
                                        Add a description...
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Subtasks</h3>
                                <button className="flex items-center text-slate-600 text-sm font-medium hover:bg-slate-100 px-2 py-1 -ml-2 rounded transition-colors">
                                    <Plus size={16} className="mr-1" /> Add subtask
                                </button>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Linked work items</h3>
                                <button className="flex items-center text-slate-600 text-sm font-medium hover:bg-slate-100 px-2 py-1 -ml-2 rounded transition-colors">
                                    <Plus size={16} className="mr-1" /> Add linked work item
                                </button>
                            </section>

                            {/* Activity Section */}
                            <section className="mt-12">
                                <div className="flex items-center justify-between mb-6 border-b border-slate-100">
                                    <div className="flex space-x-6">
                                        {tabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`cursor-pointer pb-2 text-sm font-semibold transition-all relative ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {tab.label}
                                                {activeTab === tab.id && (
                                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-in slide-in-from-left-2" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <Filter size={16} />
                                    </button>
                                </div>

                                <div className="flex space-x-3">
                                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                        MM
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="border border-slate-200 rounded-lg p-3 shadow-sm hover:border-slate-300 transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                                            <input
                                                type="text"
                                                placeholder="Add a comment..."
                                                className="w-full outline-none text-sm text-slate-800 placeholder:text-slate-400 mb-4 bg-transparent"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {["🎉 Looks good!", "👋 Need help?", "⛔ This is blocked"].map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center text-[10px] text-slate-400 space-x-1 pl-1">
                                            <span className="font-bold">Pro tip:</span>
                                            <span>press</span>
                                            <span className="bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded text-slate-600">M</span>
                                            <span>to comment</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </main>

                    {/* Sidebar (Right) */}
                    <aside className="w-full lg:w-80 p-6 sm:p-8 bg-white overflow-y-auto">
                        {/* Status Section */}
                        <div className="flex items-center space-x-2 mb-8">
                            <div className="relative group">
                                <button className="bg-green-600 hover:bg-green-700 text-white pl-3 pr-2 py-1.5 rounded flex items-center text-xs font-bold transition-colors shadow-sm">
                                    {status} <ChevronDown size={14} className="ml-1" />
                                </button>
                            </div>

                            <div className="flex items-center text-green-700 px-2.5 py-1 bg-green-50 rounded text-xs font-bold border border-green-100">
                                <Check size={12} className="mr-1.5" strokeWidth={3} /> {status}
                            </div>

                            <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded p-1.5 transition-colors">
                                <Zap size={14} />
                            </button>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center text-slate-700 font-bold text-xs uppercase tracking-wider cursor-pointer">
                                    <ChevronDown size={14} className="mr-1 text-slate-400" />
                                    Details
                                </div>
                                <Settings size={14} className="text-slate-300 group-hover:text-slate-500 cursor-pointer transition-colors" />
                            </div>

                            {/* Attributes Grid */}
                            <div className="grid grid-cols-[100px_1fr] gap-y-5 text-sm">
                                {metadata.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="text-slate-500 font-medium py-1">{item.label}</div>
                                        <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                                            {item.isUser && (
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                                    {item.icon}
                                                </div>
                                            )}
                                            {item.userInitial && (
                                                <div className={`w-6 h-6 rounded-full ${item.bgColor} text-white flex items-center justify-center text-[9px] font-bold`}>
                                                    {item.userInitial}
                                                </div>
                                            )}
                                            <span className={`${item.italic ? 'italic text-slate-400' : 'text-slate-800'} ${item.color || ''} group-hover:underline`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                ))}

                                {/* Development Rows */}
                                <div className="text-slate-500 font-medium py-1 mt-2">Development</div>
                                <div className="space-y-3 py-1 mt-2">
                                    <div className="flex items-center text-blue-600 text-sm font-medium cursor-pointer hover:underline">
                                        <Monitor size={14} className="mr-2" />
                                        <span>Open with VS Code</span>
                                        <ArrowUpRight size={12} className="ml-1 opacity-50" />
                                    </div>
                                    <div className="flex items-center text-blue-600 text-sm font-medium cursor-pointer hover:underline">
                                        <GitBranch size={14} className="mr-2" />
                                        <span>Create branch</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer timestamps */}
                        <div className="mt-16 pt-6 border-t border-slate-100 text-[11px] text-slate-400 space-y-2">
                            <p className="flex justify-between"><span>Created</span> <span className="text-slate-500">June 11, 2025, 1:17 AM</span></p>
                            <p className="flex justify-between"><span>Updated</span> <span className="text-slate-500">July 1, 2025, 6:52 PM</span></p>
                            <button className="flex items-center text-slate-400 hover:text-slate-600 pt-2 transition-colors">
                                <Settings size={12} className="mr-1.5" /> Configure
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;