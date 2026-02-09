import { Outlet } from "react-router-dom";
import React, { useState, useEffect, useMemo } from 'react';

import Sidebar from "../components/Sidebar";
import { useFrappeAuth } from "frappe-react-sdk";
import { useLocation } from "react-router-dom";
import { menuItems } from "../data/menu";
import ModalGenerator from "../components/ModalGenerator";
import { useTheme } from "../context/ThemeContext";

import Header from "../components/Header";
const MainLayout = () => {
  const location = useLocation();
  const { toggle, isDark } = useTheme()

  const auth = useFrappeAuth();

  const currentMenuItem = useMemo(() => {
    return menuItems.find(item => item.id === location.pathname.split('/')[1]);
  }, [location.pathname]);


  // const redirectPath = encodeURIComponent(location.pathname);

  // console.log("redirectPath:", location.pathname);
  // if (!auth.currentUser || location.pathname === "/login") {
  //   if (redirectPath && redirectPath !== "/login") {
  //     window.location.href = `/login?redirect-to=${redirectPath}`;
  //           return null; // or a loading spinner

  //   } else {
  //     window.location.href = "/login";
  //     return null; // or a loading spinner
  //   }
  // }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100">
        {/* Sidebar */}
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
         <Header/>

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
