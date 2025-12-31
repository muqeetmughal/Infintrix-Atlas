import { Badge, Check, CheckSquare, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { useState } from "react";
import Card from "../components/ui/Card";
import { TASK_PRIORITY_COLORS } from "../data/constants";

const AIArchitect = () => {
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
        <div className="flex">

            <div className="space-y-8 animate-in fade-in duration-500">
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
                                className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-black transition-all transform active:scale-95 ${isGenerating || !prompt
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


            </div>

            <div>
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
                                                alert("Done");
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
        </div>
    );
};

export default AIArchitect;