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
import ModalGenerator from "../components/ModalGenerator";
import { useTheme } from "../context/ThemeContext";
import { Button } from "antd";
import {
  MoonOutlined,
  SunOutlined
} from '@ant-design/icons';
const MainLayout = () => {
  const location = useLocation();
  const { toggle, isDark } = useTheme()



  const currentMenuItem = useMemo(() => {
    return menuItems.find(item => item.id === location.pathname.split('/')[1]);
  }, [location.pathname]);

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-10 flex items-center justify-between sticky top-0 z-10">


            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-600">
              <Search size={18} className="text-slate-400 dark:text-slate-400 mr-2" />
              <input type="text" placeholder="Global Search..." className="bg-transparent dark:text-slate-100 dark:placeholder:text-slate-400 border-none text-sm focus:ring-0 focus:outline-none w-48 font-medium" />
            </div>

            <div className="flex items-center space-x-6">

              <Button
                onClick={toggle}
                icon={isDark ? <MoonOutlined/>:<SunOutlined />}
                className="h-12 w-12 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-sm"
              > </Button>

              <div className="h-12 w-12 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-sm relative">
                <LogOut size={24} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-700" />
              </div>
            </div>
          </header>

          <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
            <div className="max-w-8xl mx-auto">
              <Outlet />
              <ModalGenerator />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MainLayout;
