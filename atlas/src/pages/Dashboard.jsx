import { INITIAL_PROJECTS, INITIAL_TASKS, PROJECT_STATUS_COLORS, TEAM_MEMBERS } from '../data/constants'
import { useState } from 'react';
import {
    Briefcase,
    CheckSquare,
    Users,
    TrendingUp,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { Spin } from 'antd';

const Dashboard = () => {
    const [projects] = useState(INITIAL_PROJECTS);
    const [tasks] = useState(INITIAL_TASKS);

    const project_user_stats_query = useFrappeGetCall(
        "infintrix_atlas.api.v1.get_project_user_stats",
    );

    const stats = project_user_stats_query.data?.message || {
        "total_projects": <Spin />,
        "active_tasks": <Spin />,
        "avg_progress": <Spin />,
        "team_members": <Spin />
    };
    console.log('project_user_stats_query', stats);
    // Stats configuration
    // const stats = [
    //     {
    //         label: 'Total Projects',
    //         val: projects.length,
    //         icon: Briefcase,
    //         color: 'text-indigo-600 dark:text-indigo-400',
    //         bg: 'bg-indigo-50 dark:bg-indigo-950'
    //     },
    //     {
    //         label: 'Active Tasks',
    //         val: tasks.length,
    //         icon: CheckSquare,
    //         color: 'text-amber-600 dark:text-amber-400',
    //         bg: 'bg-amber-50 dark:bg-amber-950'
    //     },
    //     {
    //         label: 'Avg Progress',
    //         val: `${Math.round(projects.reduce((acc, p) => acc + p.percent_complete, 0) / projects.length)}%`,
    //         icon: TrendingUp,
    //         color: 'text-emerald-600 dark:text-emerald-400',
    //         bg: 'bg-emerald-50 dark:bg-emerald-950'
    //     },
    //     {
    //         label: 'Team Members',
    //         val: TEAM_MEMBERS.length,
    //         icon: Users,
    //         color: 'text-blue-600 dark:text-blue-400',
    //         bg: 'bg-blue-50 dark:bg-blue-950'
    //     },
    // ];

    const recentActivities = [
        { text: "AI generated 4 new tasks for App Dev", time: "2m ago" },
        { text: "Bulk assigned 12 tasks to Mike Ross", time: "1h ago" },
        { text: "Project Migration marked Completed", time: "4h ago" },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center space-x-4">
                    <div className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 p-4 rounded-2xl">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-400 dark:text-slate-500">Total Projects</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total_projects}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center space-x-4">
                    <div className="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 p-4 rounded-2xl">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-400 dark:text-slate-500">Active Tasks</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.active_tasks}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center space-x-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-400 dark:text-slate-500">Avg Progress</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.avg_progress}%</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center space-x-4">
                    <div className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 p-4 rounded-2xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-400 dark:text-slate-500">Team Members</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.team_members}</div>
                    </div>
                </div>
            </div>

            {/* Overview and Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Overview */}
                <Card title="Quick Overview" className="lg:col-span-2">
                    <div className="space-y-6">
                        {projects.slice(0, 3).map(p => (
                            <div
                                key={p.name}
                                className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 -mx-2 px-2 py-2 rounded-2xl transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.project_name}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500">{p.project_type}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-8">
                                    <Badge className={PROJECT_STATUS_COLORS[p.status]}>{p.status}</Badge>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-slate-800 dark:text-slate-200">{p.percent_complete}%</div>
                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300"
                                                style={{ width: `${p.percent_complete}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card title="Recent Activity" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-6">
                        {recentActivities.map((act, i) => (
                            <div key={i} className="flex items-start space-x-3">
                                <div className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-500 mt-1.5 flex-shrink-0" />
                                <div>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-100">{act.text}</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">{act.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard
