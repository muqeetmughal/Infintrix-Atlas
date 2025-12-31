import { Outlet } from "react-router-dom";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  AlertCircle,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  LogOut
} from 'lucide-react';
import Sidebar from "../components/Sidebar";
import { useFrappeAuth } from "frappe-react-sdk";
import { useLocation } from "react-router-dom";
import { menuItems } from "../data/menu";

const MainLayout = () => {
  const location = useLocation();



  const currentMenuItem = useMemo(() => {
    return menuItems.find(item => item.id === location.pathname.split('/')[1]);
  }, [location.pathname]);

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-10">
            <div>
              {/* <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Module / {currentMenuItem?.label || 'Unknown'}</h1> */}
              <p className="text-2xl font-black text-slate-900 tracking-tight">{currentMenuItem?.label || 'Unknown'}</p>
            </div>


            <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
                <Search size={18} className="text-slate-400 mr-2" />
                <input type="text" placeholder="Global Search..." className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none w-48 font-medium" />
              </div>

            <div className="flex items-center space-x-6">
              
              <div className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer shadow-sm relative">
                <LogOut size={24} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
              </div>
            </div>
          </header>

          <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
            <div className="max-w-8xl mx-auto">
              <Outlet />

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MainLayout;