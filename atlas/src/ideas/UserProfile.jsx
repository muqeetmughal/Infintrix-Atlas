import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Star, 
  Settings, 
  ShieldCheck, 
  Bell, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter,
  ChevronRight,
  Edit3,
  Camera,
  Layers,
  Zap,
  Cpu,
  Coffee,
  MoreHorizontal,
  Flame,
  Check,
  MessageSquare
} from 'lucide-react';

// --- Mock Data ---

const USER_DATA = {
  name: "Alex Rivera",
  role: "Senior Full Stack Engineer",
  email: "alex.rivera@erpnext.io",
  location: "San Francisco, CA",
  joined: "March 2022",
  status: "Active / Focus Mode",
  availability: "Ready for Sync",
  bio: "Architecting scalable enterprise solutions with a focus on React, Node.js, and ERPNext integration. Passionate about clean code and mentorship.",
  skills: [
    { name: "React / Next.js", level: 95, tags: ["Tailwind", "Redux", "Zustand"] },
    { name: "Python / Frappe", level: 90, tags: ["MariaDB", "Redis", "Rest API"] },
    { name: "PostgreSQL", level: 85, tags: ["Optimization", "PL/pgSQL"] },
    { name: "System Architecture", level: 88, tags: ["Docker", "K8s", "AWS"] },
  ],
  stats: [
    { label: "Completed Tasks", value: "482", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Review Score", value: "4.95", icon: Star, color: "text-amber-500" },
    { label: "On-Time Delivery", value: "98%", icon: Zap, color: "text-indigo-500" },
    { label: "Years Exp", value: "8+", icon: Briefcase, color: "text-blue-500" }
  ],
  projects: [
    { id: 'P1', name: "Global Supply Chain Sync", role: "Lead Dev", status: "Completed", date: "Jan - May 2024", tech: "Frappe / React" },
    { id: 'P2', name: "Real-time POS Integration", role: "Architecture", status: "Active", date: "June 2024 - Present", tech: "Node.js / Redis" },
    { id: 'P3', name: "Legacy ERP Migration", role: "Senior Dev", status: "Completed", date: "Sept - Dec 2023", tech: "Python / SQL" }
  ],
  endorsements: [
    { user: "Sarah Chen", role: "CTO", text: "Alex's ability to simplify complex architectures is unparalleled." },
    { user: "Mike Ross", role: "Product Lead", text: "One of the most efficient engineers I've worked with." }
  ]
};

// --- Sub-Components ---

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:bg-white ${color}`}>
      <Icon size={24} />
    </div>
    <div className="text-2xl font-black text-slate-900 tracking-tighter">{value}</div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</div>
    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={80} />
    </div>
  </div>
);

const Badge = ({ children, className }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${className}`}>
    {children}
  </span>
);

const ContributionHeatmap = () => {
  const cells = Array.from({ length: 52 * 4 }, () => Math.floor(Math.random() * 5));
  const getColor = (val) => {
    if (val === 0) return 'bg-slate-50';
    if (val === 1) return 'bg-indigo-100';
    if (val === 2) return 'bg-indigo-300';
    if (val === 3) return 'bg-indigo-500';
    return 'bg-indigo-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Flame size={14} className="text-orange-500" />
          Annual Contribution Flow
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-bold text-slate-400 uppercase mr-1">Less</span>
          {[0, 1, 2, 3, 4].map(v => <div key={v} className={`w-2 h-2 rounded-sm ${getColor(v)}`} />)}
          <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">More</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {cells.map((val, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-[2px] ${getColor(val)} transition-all hover:scale-150 hover:z-10 cursor-pointer`}
            title={`${val} commits on this day`}
          />
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-indigo-100">
      
      {/* Profile Header / Cover */}
      <div className="h-72 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-600/30 via-slate-900 to-slate-900" />
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>
        <div className="max-w-7xl mx-auto h-full relative px-6">
           <div className="absolute bottom-10 right-6 flex gap-3">
             <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10">
               <Camera size={14} />
               Cover
             </button>
             <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20">
               <Edit3 size={14} />
               Edit Profile
             </button>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Sidebar: Main Info */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white rounded-[48px] p-8 shadow-2xl shadow-slate-300/40 text-center border border-white relative overflow-hidden">
              {/* Availability Pulse */}
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">{USER_DATA.availability}</span>
              </div>

              <div className="w-36 h-36 rounded-[48px] bg-indigo-50 border-[6px] border-white shadow-xl mx-auto mb-6 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-4xl font-black text-white group-hover:scale-110 transition-transform">AR</div>
                <div className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{USER_DATA.name}</h1>
              <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-widest">{USER_DATA.role}</p>
              
              <div className="flex items-center justify-center gap-2 my-8">
                <button className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"><Github size={18} /></button>
                <button className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"><Linkedin size={18} /></button>
                <button className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"><Twitter size={18} /></button>
              </div>

              <div className="space-y-4 text-left bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                <div className="flex items-center gap-3">
                  <MapPin size={14} className="text-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">{USER_DATA.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-indigo-500" />
                  <span className="text-xs font-bold text-slate-600 truncate">{USER_DATA.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Since {USER_DATA.joined}</span>
                </div>
              </div>

              <button className="w-full mt-8 bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group">
                <MessageSquare size={16} className="group-hover:rotate-12 transition-transform" />
                Start Chat
              </button>
            </div>

            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Bio</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                "{USER_DATA.bio}"
              </p>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 space-y-8">
            
            {/* Header / Nav Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <nav className="flex items-center bg-white p-1.5 rounded-[24px] border border-slate-200 shadow-sm w-fit">
                {[
                  { id: 'overview', label: 'Dashboard', icon: Globe },
                  { id: 'activity', label: 'History', icon: Clock },
                  { id: 'settings', label: 'Security', icon: ShieldCheck },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-3 text-slate-400">
                 <span className="text-[10px] font-black uppercase tracking-widest">Profile Integrity</span>
                 <div className="w-24 h-1.5 bg-slate-200 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                 </div>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {USER_DATA.stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                  ))}
                </div>

                {/* Heatmap Section */}
                <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                   <ContributionHeatmap />
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Skill Matrix */}
                  <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={16} className="text-indigo-600" />
                        Stack Proficiency
                      </h3>
                      <button className="text-slate-300 hover:text-indigo-600 transition-colors"><Settings size={14} /></button>
                    </div>
                    <div className="space-y-8">
                      {USER_DATA.skills.map((skill, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div>
                              <span className="text-sm font-black text-slate-800">{skill.name}</span>
                              <div className="flex gap-2 mt-1">
                                {skill.tags.map(tag => (
                                  <span key={tag} className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-indigo-600">{skill.level}%</span>
                          </div>
                          <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.4)]" style={{ width: `${skill.level}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Recommendations / Endorsements */}
                  <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                        Peer Endorsements
                      </h3>
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Ask for one</button>
                    </div>
                    <div className="space-y-6 flex-1">
                      {USER_DATA.endorsements.map((end, i) => (
                        <div key={i} className="bg-slate-50/50 p-5 rounded-[24px] border border-slate-100 relative group transition-all hover:bg-white hover:shadow-md">
                          <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <MessageSquare size={14} />
                          </div>
                          <p className="text-xs font-bold text-slate-500 leading-relaxed italic mb-4">
                            "{end.text}"
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{end.user.charAt(0)}</div>
                            <div>
                               <div className="text-[10px] font-black text-slate-900 leading-none">{end.user}</div>
                               <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{end.role}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Recent Contributions */}
                <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={16} className="text-emerald-600" />
                        Active Lifecycle
                      </h3>
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Timeline</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {USER_DATA.projects.map((proj, i) => (
                        <div key={i} className="p-6 rounded-[32px] border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-lg transition-all group">
                           <div className="flex justify-between items-start mb-4">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <Briefcase size={20} />
                              </div>
                              <Badge className={proj.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}>
                                {proj.status}
                              </Badge>
                           </div>
                           <h4 className="text-sm font-black text-slate-900 mb-1">{proj.name}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">{proj.tech}</p>
                           <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-300 uppercase">{proj.date}</span>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                           </div>
                        </div>
                      ))}
                    </div>
                </section>

                {/* Milestone Section */}
                <section className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
                   <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/20 blur-[100px] pointer-events-none" />
                   <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                     <div className="space-y-3">
                       <h3 className="text-2xl font-black tracking-tight">System Architect Mastery</h3>
                       <p className="text-slate-400 text-sm font-bold max-w-sm">Top 2% of contributors in technical architectural reviews this year.</p>
                       <div className="flex gap-4 pt-4">
                         <div className="flex flex-col">
                           <span className="text-[9px] font-black text-indigo-400 uppercase">Rank</span>
                           <span className="text-lg font-black">Diamond III</span>
                         </div>
                         <div className="w-px h-8 bg-white/10" />
                         <div className="flex flex-col">
                           <span className="text-[9px] font-black text-emerald-400 uppercase">Points</span>
                           <span className="text-lg font-black">12,480</span>
                         </div>
                       </div>
                     </div>
                     <div className="flex flex-wrap justify-center gap-4">
                        {[
                          { icon: Zap, label: "Flash Dev", color: "text-amber-400" },
                          { icon: Coffee, label: "Coffee Fueled", color: "text-indigo-400" },
                          { icon: ShieldCheck, label: "Security Hero", color: "text-emerald-400" }
                        ].map((award, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-[24px] group hover:bg-white/10 transition-all cursor-help hover:-translate-y-1 shadow-2xl">
                             <award.icon size={24} className={award.color} />
                             <span className="text-[11px] font-black uppercase tracking-widest">{award.label}</span>
                          </div>
                        ))}
                     </div>
                   </div>
                </section>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-10">Security & Preferences</h3>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Display Name</label>
                      <input type="text" defaultValue={USER_DATA.name} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-0 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Title</label>
                      <input type="text" defaultValue={USER_DATA.role} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-0 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-50 space-y-4">
                    {[
                      { icon: Bell, label: "Notification Strategy", desc: "Manage desktop and push behavior", color: "bg-blue-50 text-blue-600" },
                      { icon: ShieldCheck, label: "Two-Factor Auth", desc: "Enhanced protection for your assets", color: "bg-emerald-50 text-emerald-600" },
                      { icon: Globe, label: "Connected Accounts", desc: "Github, Linkedin and Slack sync", color: "bg-purple-50 text-purple-600" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-3xl transition-all cursor-pointer group border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all ${item.color}`}>
                            <item.icon size={22} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900">{item.label}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.desc}</div>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-10 border-t border-slate-50">
                    <button className="px-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                    <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all">Apply Updates</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
               <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Chronological Impact</h3>
                    <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-colors"><MoreHorizontal size={20} /></button>
                  </div>
                  <div className="space-y-12 ml-4">
                     {[
                       { date: "May 12, 2024", title: "Optimized Core Auth Engine", desc: "Refactored JWT logic to reduce latency by 15% and improved security headers." },
                       { date: "April 28, 2024", title: "Launched Supply Chain Module", desc: "Collaborated with the logistics team to implement real-time tracking dashboard." },
                       { date: "March 15, 2024", title: "Migrated RDS Cluster", desc: "Successfully moved production database to a high-availability cluster without downtime." },
                       { date: "Feb 02, 2024", title: "UI System Overhaul", desc: "Established new design tokens for the internal management suite using Tailwind CSS." }
                     ].map((item, i) => (
                       <div key={i} className="flex gap-10 relative group">
                          <div className={`w-1 bg-slate-100 absolute left-[15px] top-8 bottom-0 transition-colors group-hover:bg-indigo-100 ${i === 3 ? 'h-0' : ''}`} />
                          <div className="w-8 h-8 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-300 z-10 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white group-hover:scale-110 shadow-sm transition-all">
                             <TrendingUp size={14} />
                          </div>
                          <div className="pb-4">
                             <div className="text-sm font-black text-slate-900 mb-1">{item.title}</div>
                             <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">{item.date}</div>
                             <p className="text-xs font-bold text-slate-500 max-w-xl leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                               {item.desc}
                             </p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}