import { INITIAL_PROJECTS, INITIAL_TASKS, PROJECT_STATUS_COLORS, TEAM_MEMBERS } from '../data/constants'
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  CheckSquare, 
  Users,
  TrendingUp,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
const Dashboard = () => {
const [projects] = useState(INITIAL_PROJECTS);
const [tasks] = useState(INITIAL_TASKS);
const [team_members] = useState(TEAM_MEMBERS);

return (
        <div> <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.percent_complete}%` }} />
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
        </div></div>
    )
}

export default Dashboard