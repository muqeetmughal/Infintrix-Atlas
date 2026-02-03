import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Share2,
  MoreHorizontal,
  Eye,
  Lock,
  Plus,
  Settings,
  Check,
  ChevronDown,
  Zap,
  Filter,
  GripVertical,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import dayjs from "dayjs";
import { AssigneeSelectWidget } from "../components/widgets/AssigneeSelectWidget";
import TextWidget from "../components/widgets/TextWidget";
import RichTextWidget from "../components/widgets/RichTextWidget";
import { TagsSelectWidget } from "../components/widgets/TagsSelectWidget";
import StatusWidget from "../components/widgets/StatusWidget";
import { Button, Dropdown, Space } from "antd";
import WorkItemTypeWidget from "../components/widgets/WorkItemTypeWidget";
import CommentSection from "../components/CommentSection";
import HistorySection from "../components/HistorySection";
import SubTasks from "../components/SubTasks";

const TaskDetail = () => {
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const [position] = useState("modal");
  const [activeTab, setActiveTab] = useState("comments");
  const [searchParams, setSearchParams] = useSearchParams();
  const updateMutation = useFrappeUpdateDoc();
  const selectedTask = searchParams.get("selected_task") || null;

  const task_details_query = useFrappeGetDoc("Task", selectedTask || "");

  const assignee_of_task_query = useFrappeGetDocList("ToDo", {
    filters: [
      ["reference_type", "=", "Task"],
      ["reference_name", "=", selectedTask || ""],
      ["status", "=", "Open"],
    ],
    fields: ["allocated_to"],
    limit_page_length: 1,
  });
  const assignee_mutation = useFrappePostCall(
    "infintrix_atlas.api.v1.switch_assignee_of_task"
  );

  const assignees_of_task = (assignee_of_task_query?.data || []).map((todo) => {
    return todo.allocated_to;
  });

  const task = task_details_query.data || {};

  const labels_of_task = ((task?._user_tags || "").split(",") || []).filter(
    (tag) => tag.trim() !== ""
  );

  const onClose = () => {
    searchParams.delete("selected_task");
    setSearchParams(searchParams);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;

        if (newWidth >= 300 && newWidth <= 900) {
          // Removed setMainWidth as it's not used
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (!selectedTask) return null;

  const tabs = [
    { id: "comments", label: "Comments" },
    { id: "history", label: "History" },
  ];

  if (task_details_query.isLoading || assignee_of_task_query.isLoading) {
    return <div className="text-slate-900 dark:text-slate-100">Loading...</div>;
  }

  const TaskBody = (
    <div className="task-body overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Navigation Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center font-medium cursor-pointer hover:underline">
            <WorkItemTypeWidget
              value={task.type}
              onChange={(newType) => {
                updateMutation
                  .updateDoc("Task", task.name, {
                    type: newType,
                  })
                  .then(() => {
                    task_details_query.mutate();
                  });
              }}
            />
            <span className="text-slate-900 dark:text-slate-100">{task.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3 text-slate-500 dark:text-slate-400">
          <button
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Lock issue"
          >
            <Lock size={18} />
          </button>
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded border border-blue-100 dark:border-blue-800 text-xs font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
            <Eye size={14} className="mr-1.5" /> 1
          </div>
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
            <Share2 size={18} />
          </button>
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
            <MoreHorizontal size={18} />
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors ml-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Main Content (Left) */}
        <main className="flex-1 p-6 sm:p-10 overflow-y-auto custom-scrollbar border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h1 className="text-3xl font-semibold mb-6 leading-tight text-slate-900 dark:text-slate-100">
            <TextWidget
              style={{
                fontSize: "2rem",
              }}
              value={task.subject}
              onSubmit={(newValue) => {
                updateMutation
                  .updateDoc("Task", task.name, {
                    subject: newValue,
                  })
                  .then(() => {
                    task_details_query.mutate();
                  });
              }}
            />
          </h1>

          {/* <div className="flex space-x-2 mb-10">
            <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded transition-all active:scale-95">
              <Plus size={20} />
            </button>
            <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded transition-all active:scale-95">
              <Settings size={20} />
            </button>
          </div> */}

          {/* Content Sections */}
          <div className="space-y-10">
            <section>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                Description
              </h3>
              <div className="group relative">
                <RichTextWidget
                  value={task.description}
                  onSubmit={(newValue) => {
                    updateMutation
                      .updateDoc("Task", task.name, {
                        description: newValue,
                      })
                      .then(() => {
                        task_details_query.mutate();
                      });
                    }}
                  />
                  </div>
                </section>

               {/* <SubTasks task={selectedTask} />

                <section>
                  <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  Linked work items
                  </h3>
                  <button className="flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 -ml-2 rounded transition-colors">
                  <Plus size={16} className="mr-1" /> Add linked work item
                  </button>
                </section> */}

                {/* Activity Section */}
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex space-x-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`cursor-pointer pb-2 text-sm font-semibold transition-all relative ${
                        activeTab === tab.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 animate-in slide-in-from-left-2" />
                      )}
                    </button>
                  ))}
                </div>
                <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <Filter size={16} />
                </button>
              </div>
              {
                tabs.map((tab) => {
                  if (tab.id === activeTab) {
                    return (
                      <div key={tab.id} className="">
                        {/* Render content based on active tab */}
                        {tab.id === "comments" && (
                          <CommentSection task_id={task.name} />
                        )}
                        {tab.id === "history" && (
                         <HistorySection task_id={task.name} />
                        )}
                      </div>
                    );
                  }
                  return null;
                })
              }

            

              
            </section>
          </div>
        </main>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className={`
            w-1.5 cursor-col-resize transition-all duration-200 z-10 relative shrink-0
            ${isResizing ? 'bg-blue-500 dark:bg-blue-400 w-2' : 'bg-slate-200 dark:bg-slate-700 hover:bg-blue-400 dark:hover:bg-blue-500 hover:w-2'}
          `}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className={`rounded-full p-0.5 ${isResizing ? 'bg-blue-500 dark:bg-blue-400 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
              <GripVertical size={14} />
            </div>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <aside className="w-full lg:w-90 p-6 sm:p-8 bg-white dark:bg-slate-900 overflow-y-auto">
          {/* Status Section */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="relative group">
              <StatusWidget
                value={task.status}
                onChange={(newStatus) => {
                  updateMutation
                    .updateDoc("Task", task.name, {
                      status: newStatus,
                    })
                    .then(() => {
                      task_details_query.mutate();
                    });
                }}
              />
            </div>

            {task.status === "Completed" && (
              <div className="flex items-center text-green-700 dark:text-green-400 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 rounded text-xs font-bold border border-green-100 dark:border-green-800">
                <Check size={12} className="mr-1.5" strokeWidth={3} /> Done
              </div>
            )}

            <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 transition-colors">
              <Zap size={14} />
            </button>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between group">
              <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer">
                <ChevronDown size={14} className="mr-1 text-slate-400 dark:text-slate-500" />
                Details
              </div>
              <Settings
                size={14}
                className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 cursor-pointer transition-colors"
              />
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-[100px_1fr] gap-y-5 text-sm">
              <>
                <div className="text-slate-500 dark:text-slate-400 font-medium py-1">Assignee</div>
                {console.log("assignees_of_task", assignees_of_task)}
                <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                  <AssigneeSelectWidget
                    single={true}
                    value={assignees_of_task || []}
                    onChange={(newAssignee) => {
                      if (!newAssignee || newAssignee.length === 0) return;
                      assignee_mutation.call({
                        task_name: task.name,
                        new_assignee: newAssignee[0],
                      });
                    }}
                  />
                </div>
              </>
              <>
                <div className="text-slate-500 dark:text-slate-400 font-medium py-1">Labels</div>
                <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                  <TagsSelectWidget
                    mode={"tags"}
                    docname={task.name}
                    value={labels_of_task || []}
                  />
                </div>
              </>
              <>
                <div className="text-slate-500 dark:text-slate-400 font-medium py-1">Reporter</div>
                <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                  {task.owner}
                 
                </div>
              </>
            </div>
          </div>

          {/* Footer timestamps */}
          <div className="mt-16 pt-6 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 space-y-2">
            <p className="flex justify-between">
              <span>Created</span>
              <span className="text-slate-500 dark:text-slate-400">
                {dayjs(task.creation).format("MMMM D, YYYY, h:mm A")}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Updated</span>
              <span className="text-slate-500 dark:text-slate-400">
                {dayjs(task.modified).format("MMMM D, YYYY, h:mm A")}
              </span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );

  if (position === "modal") {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl overflow-hidden">
          {TaskBody}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden">
      {TaskBody}
    </div>
  );
};

export default TaskDetail;
