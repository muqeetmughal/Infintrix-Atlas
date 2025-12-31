import { AlertCircle, Search } from 'lucide-react'
import React from 'react'

const Header = () => {
    return (
        <><header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-10">
            <div>
                <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Module / {'activeTab'}</h1>
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
        </header></>
    )
}

export default Header