import { Progress, Spin } from 'antd';
import { useFrappeGetCall, useFrappeGetDoc } from 'frappe-react-sdk';
import { useState, useEffect, useRef } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';

const ProjectHealth = ({
  project_id,
  collapsible = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  const metrics_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.get_project_flow_metrics",
    { project: project_id }
  );

  const project_query = useFrappeGetDoc(
    "Project",
    project_id,
    project_id ? ["Project", project_id] : null,
  );

  const project = project_query.data;

  useEffect(() => {
    if (isHovering && isCollapsed && collapsible) {
      hoverTimerRef.current = setTimeout(() => {
        setIsCollapsed(false);
      }, 500);
    } else {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    }

    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [isHovering, isCollapsed, collapsible]);

  useEffect(() => {
    if (!isCollapsed && !isHovering && collapsible) {
      idleTimerRef.current = setTimeout(() => {
        setIsCollapsed(true);
      }, 500);
    } else {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    }

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isCollapsed, isHovering, collapsible]);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  if (!project) {
    return null;
  }

  return (
    <footer
      className={`z-500 fixed bottom-8 left-1/2 -translate-x-1/2 px-8 bg-white dark:bg-slate-900 rounded-[40px] text-slate-900 dark:text-white flex items-center justify-between shadow-2xl border border-slate-200 dark:border-transparent transition-all duration-300 ease-in-out ${isCollapsed ? 'py-2 w-auto' : 'py-4 w-fit'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {metrics_query.isLoading ? (
        <Spin />
      ) : (
        <>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mr-4 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          )}

          <div className={`overflow-hidden transition-all duration-600 ease-in-out ${!isCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 hidden'}`}>
            <div className="flex items-center gap-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Efficiency
                </span>
                <span className="text-2xl font-black tracking-tighter">
                  {metrics_query?.data?.message?.efficiency}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Backlog Health
                </span>
                <span className={`text-2xl font-black tracking-tighter text-${metrics_query?.data?.message?.color}-500`}>
                  {metrics_query?.data?.message?.health}
                </span>
                {metrics_query?.data?.message?.message && (
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-2">
                    💡 {metrics_query?.data?.message?.message}
                  </span>
                )}
              </div>
              <div className='text-white'>
                <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">
                  Progress
                </span>
                <Progress
                  percent={project.percent_complete}
                  size="small"
                  status="active"
                  showInfo={true}
                />
              </div>
            </div>
          </div>

          {isCollapsed && collapsible && (
            <div className={`flex items-center gap-4 text-xs transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}>
              <span className="font-black">{metrics_query?.data?.message?.efficiency}%</span>
              <span className="font-black">{metrics_query?.data?.message?.health}</span>
              <span className="font-black">{project.percent_complete}%</span>
            </div>
          )}
        </>
      )}
    </footer>
  )
}

export default ProjectHealth
