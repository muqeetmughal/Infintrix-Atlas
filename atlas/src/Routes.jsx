import { createBrowserRouter, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import NotFound from "./components/NotFound";
import Projects from "./pages/Projects";
import Dashboard from "./pages/Dashboard";
import AIArchitect from "./pages/AIArchitect";
import Tasks from "./pages/Tasks";
import TaskForm from "./pages/TaskForm";
export const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <MainLayout />,
            errorElement: <NotFound />,
            // loader: rootLoader,
            children: [
                // {
                //   path: "auth",
                //   element: <PublicLayout />,
                //   children: [
                //     {
                //       path: "login",
                //       element: <Login />,
                //     }
                //   ],
                // },
                {
                    path: "",
                    element: <Navigate to={`dashboard`} />,
                },
                {
                    path: "tasks",
                    element: <Navigate to={`list`} />,
                },
                {
                    path: "dashboard",
                    element: <Dashboard />,
                },
                {
                    path: "projects",
                    element: <Projects />,
                },
                {
                    path: ":doctype_plural/create",
                    element: <TaskForm />
                }, {
                    path: "ai-gen",
                    element: <AIArchitect />
                }, {
                    path: "tasks/:view",
                    element: <Tasks />
                }


            ],


        },
    ],
    {
        basename: `/${import.meta.env.VITE_BASE_NAME}`,
    }
);