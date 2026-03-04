import { createBrowserRouter, Navigate } from "react-router-dom";

import { lazy } from "react";

const MainLayout = lazy(() => import("./layouts/MainLayout"));
const NotFound = lazy(() => import("./components/NotFound"));
const Projects = lazy(() => import("./pages/Projects"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AIArchitect = lazy(() => import("./pages/AIArchitect"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskForm = lazy(() => import("./pages/TaskForm"));
const ErrorBoundary = lazy(() => import("./components/ErrorBoundry"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Team = lazy(() => import("./pages/Team"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      errorElement: <ErrorBoundary />,
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
        // {
        //     path: "tasks",
        //     element: <Tasks />,
        // },
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
          element: <TaskForm />,
        },
        {
          path: "ai-gen",
          element: <AIArchitect />,
        },
        // {
        //     path: "tasks/:project/:view",
        //     element: <Tasks />
        // },
        {
          path: "tasks/:view",
          element: <Tasks />,
        },
        {
            path : "profile",
            element : <Profile/>
        },
        {
            path : "team",
            element : <Team/>
        },
        {
            path : "team/:id",
            element : <TeamDetail/>
        },
     
        {
          path: "*",
          element: <NotFound />,
        },
      ],
    },
    {
        path: "login",
        errorElement: <ErrorBoundary />,
        element: <Login />,
    }
  ],
  {
    basename: `/${import.meta.env.VITE_BASE_NAME}`,
  },
);
