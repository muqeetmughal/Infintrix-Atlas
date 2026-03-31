import { useNavigate } from "react-router-dom";
import { Info, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Dropdown } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/query";
import GlobalSearch from "./GlobalSearch";
import Notifications from "./Notifications";
import Logo from "./Logo";
import { useFrappeGetCall } from "frappe-react-sdk";

const Header = () => {
  const { toggle, isDark } = useTheme();

  const navigate = useNavigate();

  const auth = useAuth();
  const installed_apps_query = useFrappeGetCall("frappe.apps.get_apps");
  const installed_apps = installed_apps_query.data?.message || [];

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-10 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          
            <div className="sm:hidden">
              <Logo fullLogo={false} />
            </div>
        </div>
        <GlobalSearch />
        <div className="flex items-center space-x-6">
          <button
            onClick={toggle}
            className="h-12 w-12 bg-linear-to-br from-amber-50 to-orange-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-amber-200 dark:border-indigo-700 rounded-2xl flex items-center justify-center text-amber-600 dark:text-indigo-400 hover:from-amber-100 hover:to-orange-100 dark:hover:from-indigo-800/30 dark:hover:to-purple-800/30 cursor-pointer shadow-sm transition-all duration-300"
          >
            {isDark ? (
              <MoonOutlined className="text-lg" />
            ) : (
              <SunOutlined className="text-lg" />
            )}
          </button>

          <Notifications />
          <Dropdown
          popupRender={(originNode)=>{

            return (
              <>
               
                {originNode}
              </>
            )

          }}
            trigger={"click"}
            menu={{
              items: [


                {
                  icon: <LayoutDashboard  size={16}/>,
                  key: "apps",
                  label: "Apps",
                  children: installed_apps.map((app) => ({
                    key: app.name,
                    label: (
                      <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => {
                          window.location.href = app.route;
                        }}
                      >
                        <img
                          src={app.logo}
                          alt={app.title}
                          className="w-5 h-5"
                        />
                        <span>{app.title}</span>
                      </div>
                    ),
                  })),
                },
                {
                  key: "about",
                  label: "About",
                  icon: <Info  size={16}/>,
                },
                {
                  key: "profile",
                  label: "Profile",
                  icon: <User size={16} />,
                  onClick: () => navigate("/profile"),
                },
                {
                  key: "settings",
                  label: "Settings",
                  icon: <Settings size={16} />,
                  onClick: () => navigate("/settings"),
                },
                {
                  key: "logout",
                  label: "Logout",
                  icon: <LogOut size={16} />,
                  danger: true,
                  onClick: () => {
                    auth.logout().then(() => {
                      navigate("/login");
                    });
                  },
                },
              ],
            }}
          >
            <div
              className={`rounded-2xl p-2 flex items-center space-x-3 transition-opacity duration-300 opacity-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                {auth?.user?.user_image ? (
                  <img
                    className="rounded-full"
                    src={auth.user.user_image}
                    alt="User Avatar"
                  />
                ) : (
                  auth.user?.name?.charAt(0).toUpperCase()
                )}
              </div>
          
            </div>
          </Dropdown>
        </div>
      </header>
    </>
  );
};

export default Header;
