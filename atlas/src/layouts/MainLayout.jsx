import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";

import Sidebar from "../components/Sidebar";
import { useFrappeAuth } from "frappe-react-sdk";
import { menuItems } from "../data/menu";
import ModalGenerator from "../components/ModalGenerator";
import ProjectModal from "../components/custom/ProjectModal";
import { Spin } from "antd";

import Header from "../components/Header";

const MainLayout = () => {
  const location = useLocation();

  const auth = useFrappeAuth();

  const currentMenuItem = useMemo(() => {
    return menuItems.find(item => item.id === location.pathname.split('/')[1]);
  }, [location.pathname]);

  const isLoading = auth.isLoading || (auth.currentUser === undefined);
  const isAuthenticated = !!auth.currentUser && auth.currentUser !== "Guest";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    window.location.href = `/login?redirect-to=${redirectPath}`;
    return null;
  }

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
              <ProjectModal />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MainLayout;
