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
      }, 3000);
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
      className={`z-500 fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 px-4 md:px-8 bg-white dark:bg-slate-900 rounded-[40px] text-slate-900 dark:text-white flex items-center justify-between shadow-2xl border border-slate-200 dark:border-transparent transition-all duration-300 ease-in-out max-w-[calc(100vw-2rem)] ${isCollapsed ? 'py-2 w-auto' : 'py-3 md:py-4 w-fit'}`}
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
              className="mr-2 md:mr-4 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronUpIcon className="w-3 h-3 md:w-4 md:h-4" />
              ) : (
                <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </button>
          )}

          <div className={`overflow-hidden transition-all duration-600 ease-in-out ${!isCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 hidden'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:gap-10">
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Efficiency
                </span>
                <span className="text-xl md:text-2xl font-black tracking-tighter">
                  {metrics_query?.data?.message?.efficiency}%
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Backlog Health
                </span>
                <span className={`text-xl md:text-2xl font-black tracking-tighter text-${metrics_query?.data?.message?.color}-500`}>
                  {metrics_query?.data?.message?.health}
                </span>
                {metrics_query?.data?.message?.message && (
                  <span className="text-[9px] md:text-[10px] text-slate-600 dark:text-slate-400 mt-1 md:mt-2 break-words">
                    💡 {metrics_query?.data?.message?.message}
                  </span>
                )}
              </div>
              <div className='text-white w-full sm:w-auto min-w-[120px]'>
                <span className="text-[9px] md:text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">
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
            <div className={`flex items-center gap-2 md:gap-4 text-[10px] md:text-xs transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}>
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
