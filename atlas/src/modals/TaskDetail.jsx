import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  Maximize,
  Minimize,
  Trash,
  Menu,
  ExternalLink,
  MessageCircle,
  History,
  RotateCcw,
  Send,
  ThumbsUp,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
  useFrappeDeleteDoc,
  useFrappeCreateDoc,
} from "frappe-react-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Modal as AntdModal, Drawer, Typography, message } from "antd";
import dayjs from "dayjs";
import {
  UsersSelectWidget,
  ShowUserWidget,
} from "../components/widgets/AssigneeSelectWidget";
import RichTextWidget from "../components/widgets/RichTextWidget/RichTextWidget";
import { TagsSelectWidget } from "../components/widgets/TagsSelectWidget";
import StatusWidget from "../components/widgets/StatusWidget";
import { Button, Dropdown, Space, Form, Input, Select } from "antd";
import WorkItemTypeWidget from "../components/widgets/WorkItemTypeWidget";
import SubTasks from "../components/SubTasks";
import {
  useAssigneeOfTask,
  useAssigneeUpdateMutation,
  useTaskDetailsQuery,
} from "../hooks/query";
import { useGetDoctypeField } from "../hooks/doctype";
import SubjectWidget from "../components/widgets/SubjectWidget";
import FileAttachment from "./FileAttachment";
import PriorityWidget from "../components/widgets/PriorityWidget";
import ActivityTimeline from "../components/ActivityTimeline";
import TaskCopilot from "../components/TaskCopilot";
import TaskSkeleton from "./TaskSkeleton";
import WatchersWidget from "../components/WatchersWidget";
import RelativeTime from "../components/RelativeTime";

function ReviewHistory({ logs }) {
  if (!logs || !logs.length) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">No review history</div>;
  }
  const sorted = [...logs].sort((a, b) => new Date(b.reviewed_on) - new Date(a.reviewed_on));
  return (
    <div className="space-y-3">
      {sorted.map((log, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${log.decision === "Approved" ? "bg-green-500" : "bg-amber-500"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">{log.reviewer}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${log.decision === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                {log.decision}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {dayjs(log.reviewed_on).format("MMM D, YYYY h:mm A")}
            </div>
            {log.comments && (
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{log.comments}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReopenHistory({ logs }) {
  if (!logs || !logs.length) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">No reopen history</div>;
  }
  const sorted = [...logs].sort((a, b) => new Date(b.reopened_on) - new Date(a.reopened_on));
  return (
    <div className="space-y-3">
      {sorted.map((log, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="w-2 h-2 mt-2 rounded-full shrink-0 bg-purple-500" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">{log.user || log.employee}</span>
              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {log.reopen_type}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              #{log.reopen_sequence} &middot; {dayjs(log.reopened_on).format("MMM D, YYYY h:mm A")}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{log.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TaskBody = React.memo(({ task, fullScreen, setFullScreen }) => {
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const updateMutation = useFrappeUpdateDoc();
  const [searchParams, setSearchParams] = useSearchParams();
  const assignee_update_mutation = useAssigneeUpdateMutation();
  const { deleteDoc } = useFrappeDeleteDoc();

  const selectedTask = searchParams.get("selected_task") || null;
  const task_details_query = useTaskDetailsQuery(selectedTask);
  const assignee_of_task_query = useAssigneeOfTask(selectedTask);
  const task_assignee = useMemo(
    () => assignee_of_task_query?.data?.message || null,
    [assignee_of_task_query?.data?.message],
  );

  const labels_of_task = useMemo(() => {
    return ((task?._user_tags || "").split(",") || []).filter(
      (tag) => tag.trim() !== "",
    );
  }, [task?._user_tags]);

  const [reviewModal, setReviewModal] = useState(null);
  const [approveComments, setApproveComments] = useState("");
  const [requestComments, setRequestComments] = useState("");
  const [reopenType, setReopenType] = useState("Bug Found");
  const [reopenReason, setReopenReason] = useState("");
  const [activeHistoryTab, setActiveHistoryTab] = useState("review");

  const submitForReviewCall = useFrappePostCall("infintrix_atlas.api.task_review.submit_for_review");
  const approveTaskCall = useFrappePostCall("infintrix_atlas.api.task_review.approve_task");
  const requestChangesCall = useFrappePostCall("infintrix_atlas.api.task_review.request_changes");
  const reopenTaskCall = useFrappePostCall("infintrix_atlas.api.task_review.reopen_task");

  const handleSubmitForReview = async () => {
    try {
      await submitForReviewCall.call({ task_name: task.name });
      message.success("Task submitted for review");
      task_details_query.mutate();
    } catch (err) {
      message.error(err?.message || "Failed to submit for review");
    }
  };

  const handleApprove = async () => {
    try {
      await approveTaskCall.call({ task_name: task.name, comments: approveComments || null });
      message.success("Task approved");
      setReviewModal(null);
      setApproveComments("");
      task_details_query.mutate();
    } catch (err) {
      message.error(err?.message || "Failed to approve task");
    }
  };

  const handleRequestChanges = async () => {
    if (!requestComments.trim()) {
      message.error("Comments are required");
      return;
    }
    try {
      await requestChangesCall.call({ task_name: task.name, comments: requestComments });
      message.success("Changes requested");
      setReviewModal(null);
      setRequestComments("");
      task_details_query.mutate();
    } catch (err) {
      message.error(err?.message || "Failed to request changes");
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      message.error("Reason is required");
      return;
    }
    try {
      await reopenTaskCall.call({ task_name: task.name, reason: reopenReason, reopen_type: reopenType });
      message.success("Task reopened");
      setReviewModal(null);
      setReopenReason("");
      setReopenType("Bug Found");
      task_details_query.mutate();
    } catch (err) {
      message.error(err?.message || "Failed to reopen task");
    }
  };

  const onClose = useCallback(() => {
    searchParams.delete("selected_task");
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // const resize = useCallback(
  //   (e) => {
  //     if (isResizing && containerRef.current) {
  //       const containerRect = containerRef.current.getBoundingClientRect();
  //       const newWidth = e.clientX - containerRect.left;

  //       if (newWidth >= 300 && newWidth <= 900) {
  //       }
  //     }
  //   },
  //   [isResizing],
  // );

  // const startResizing = useCallback((e) => {
  //   setIsResizing(true);
  //   e.preventDefault();
  // }, []);

  // const stopResizing = useCallback(() => {
  //   setIsResizing(false);
  // }, []);

  // useEffect(() => {
  //   if (isResizing) {
  //     window.addEventListener("mousemove", resize);
  //     window.addEventListener("mouseup", stopResizing);
  //     document.body.style.cursor = "col-resize";
  //     document.body.style.userSelect = "none";
  //   } else {
  //     window.removeEventListener("mousemove", resize);
  //     window.removeEventListener("mouseup", stopResizing);
  //     document.body.style.cursor = "default";
  //     document.body.style.userSelect = "auto";
  //   }

  //   return () => {
  //     window.removeEventListener("mousemove", resize);
  //     window.removeEventListener("mouseup", stopResizing);
  //   };
  // }, [isResizing, resize, stopResizing]);

  return (
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
            <span className="text-slate-900 dark:text-slate-100">
              {task.name}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3 text-slate-500 dark:text-slate-400">
          <button
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Lock issue"
          >
            <Lock size={18} />
          </button>
          <WatchersWidget doctype="Task" docname={task.name} />
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
            <Share2 size={18} />
          </button>
          <Button
            onClick={() => {
              searchParams.set("copilot", "true");
              setSearchParams(searchParams);
            }}
            // className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <MessageCircle size={16} />
          </Button>
          <Dropdown
            trigger={"click"}
            menu={{
              items: [
                {
                  key: "open_in_desk",
                  label: "Open in Desk",
                  icon: <ExternalLink size={14} />,
                  onClick: () => {
                    window.open(`/app/task/${task.name}`, "_blank");
                  },
                },
                {
                  key: "delete_task",
                  label: "Delete Task",
                  danger: true,
                  icon: <Trash size={14} />,
                  onClick: () => {
                    AntdModal.confirm({
                      title: "Delete task",
                      content:
                        "Are you sure you want to delete this task? This action cannot be undone.",
                      okText: "Delete",
                      okType: "danger",
                      cancelText: "Cancel",
                      onOk: async () => {
                        try {
                          if (!task.name) return;
                          await deleteDoc("Task", task.name);
                          onClose();
                        } catch (err) {
                          console.error("Failed to delete task", err);
                        }
                      },
                    });
                  },
                },
              ],
            }}
          >
            <Button icon={<Menu size={16} />}></Button>
          </Dropdown>
          <Button
            icon={fullScreen ? <Maximize size={18} /> : <Minimize size={18} />}
            onClick={() => setFullScreen(!fullScreen)}
          ></Button>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors ml-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden flex-col lg:flex-row"
      >
        {/* Main Content (Left) */}
        <main className="flex-1 p-6 sm:p-10 overflow-y-auto custom-scrollbar border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h1 className="text-3xl font-semibold mb-6 leading-tight text-slate-900 dark:text-slate-100">
            <SubjectWidget
              disableClick={true}
              task={task}
              inputStyle={{
                fontSize: "2rem",
              }}
              style={{
                fontSize: "2rem",
                fontWeight: "600",
                marginBottom: "1.5rem",
              }}
              value={task.subject}
              // onSubmit={(newValue) => {
              //   updateMutation
              //     .updateDoc("Task", task.name, {
              //       subject: newValue,
              //     })
              //     .then(() => {
              //       task_details_query.mutate();
              //     });
              // }}
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
                  loading={updateMutation.loading}
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

            <SubTasks task={selectedTask} />

            {/* <section>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                Linked work items
              </h3>
              <button className="flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 -ml-2 rounded transition-colors">
                <Plus size={16} className="mr-1" /> Add linked work item
              </button>
            </section> */}

            {/* Review / Reopen History */}
            {(task.custom_task_review_logs?.length > 0 || task.custom_task_reopen_logs?.length > 0) && (
              <section>
                <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 mb-4">
                  <button
                    onClick={() => setActiveHistoryTab("review")}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeHistoryTab === "review" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Review History ({task.custom_task_review_logs?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveHistoryTab("reopen")}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeHistoryTab === "reopen" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    Reopen History ({task.custom_task_reopen_logs?.length || 0})
                  </button>
                </div>
                {activeHistoryTab === "review" ? (
                  <ReviewHistory logs={task.custom_task_review_logs} />
                ) : (
                  <ReopenHistory logs={task.custom_task_reopen_logs} />
                )}
              </section>
            )}

            {/* Activity Section */}
            <section className="mt-12">
              <ActivityTimeline task_id={task.name} />
            </section>
          </div>
        </main>

        {/* Resizer Handle */}
        <div
          // onMouseDown={startResizing}
          className={`
            w-1.5 cursor-col-resize transition-all duration-200 z-10 relative shrink-0
            ${isResizing ? "bg-blue-500 dark:bg-blue-400 w-2" : "bg-slate-200 dark:bg-slate-700 hover:bg-blue-400 dark:hover:bg-blue-500 hover:w-2"}
          `}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div
              className={`rounded-full p-0.5 ${isResizing ? "bg-blue-500 dark:bg-blue-400 text-white shadow-lg" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"}`}
            >
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
                  const oldStatus = task.status;
                  updateMutation
                    .updateDoc("Task", task.name, {
                      status: newStatus,
                    })
                    .then(() => {
                      task_details_query.mutate();
                      // Notify assigned users about status change
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

          {/* Review Actions */}
          {task.status === "Working" && (
            <div className="mb-6">
              <Button
                type="primary"
                block
                icon={<Send size={14} />}
                onClick={handleSubmitForReview}
                loading={submitForReviewCall.loading}
              >
                Submit For Review
              </Button>
            </div>
          )}

          {task.status === "Pending Review" && (
            <div className="mb-6 space-y-2">
              <Button
                type="primary"
                block
                icon={<ThumbsUp size={14} />}
                onClick={() => setReviewModal("approve")}
              >
                Approve
              </Button>
              <Button
                block
                icon={<History size={14} />}
                onClick={() => setReviewModal("request_changes")}
              >
                Request Changes
              </Button>
            </div>
          )}

          {task.status === "Completed" && (
            <div className="mb-6">
              <Button
                block
                icon={<RotateCcw size={14} />}
                onClick={() => setReviewModal("reopen")}
              >
                Reopen Task
              </Button>
            </div>
          )}

          {/* Details Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between group">
              <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer">
                <ChevronDown
                  size={14}
                  className="mr-1 text-slate-400 dark:text-slate-500"
                />
                Details
              </div>
              <Settings
                size={14}
                className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 cursor-pointer transition-colors"
              />
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
              <>
                <div className="text-slate-500 dark:text-slate-400 font-medium py-1">
                  Assignee
                </div>
                <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                  <UsersSelectWidget
                    show_label={true}
                    mode={"assignee"}
                    value={task_assignee}
                    onSelect={(value) => {
                      //  alert(value);
                      assignee_update_mutation
                        .call({
                          task_name: task.name,
                          new_assignee: value,
                        })
                        .then(() => {
                          task_details_query.mutate();
                          assignee_of_task_query.mutate();
                        });
                    }}
                  />
                </div>
              </>
              <>
                <div className="text-slate-500 dark:text-slate-400 font-medium py-1">
                  Priority
                </div>
                <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                  <PriorityWidget
                    value={task.priority}
                    onChange={(newPriority) => {
                      updateMutation
                        .updateDoc("Task", task.name, {
                          priority: newPriority,
                        })
                        .then(() => {
                          task_details_query.mutate();
                        });
                    }}
                  />
                </div>
              </>
              <>
                <div className="text-slate-500 dark:text-slate-400 font-medium py-1">
                  Labels
                </div>
                <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                  <TagsSelectWidget
                    mode={"tags"}
                    docname={task.name}
                    value={labels_of_task || []}
                  />
                </div>
              </>

              <>
                <div className="text-slate-500 dark:text-slate-400 font-medium py-1">
                  Reporter
                </div>
                <div className="flex items-center space-x-2 py-1 group cursor-pointer">
                  <ShowUserWidget value={task.owner} show_label={true} />
                </div>
              </>
            </div>
          </div>

          <FileAttachment
            doctype="Task"
            docname={task.name}
            // fieldname="attachments"
          />

          {/* Footer timestamps */}
          <div className="mt-16 pt-6 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 space-y-2">
            <p className="flex justify-between">
              <span>Created</span>
              <span className="text-slate-500 dark:text-slate-400">
                <RelativeTime date={task.creation} />
              </span>
            </p>
            <p className="flex justify-between">
              <span>Updated</span>
              <span className="text-slate-500 dark:text-slate-400">
                <RelativeTime date={task.modified} />
              </span>
            </p>
          </div>
        </aside>
      </div>

      {/* Approve Modal */}
      <AntdModal
        title="Approve Task"
        open={reviewModal === "approve"}
        onOk={handleApprove}
        onCancel={() => { setReviewModal(null); setApproveComments(""); }}
        confirmLoading={approveTaskCall.loading}
        okText="Approve"
      >
        <Input.TextArea
          placeholder="Comments (optional)"
          value={approveComments}
          onChange={(e) => setApproveComments(e.target.value)}
          rows={3}
        />
      </AntdModal>

      {/* Request Changes Modal */}
      <AntdModal
        title="Request Changes"
        open={reviewModal === "request_changes"}
        onOk={handleRequestChanges}
        onCancel={() => { setReviewModal(null); setRequestComments(""); }}
        confirmLoading={requestChangesCall.loading}
        okText="Request Changes"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Provide feedback on what needs to be changed.</p>
          <Input.TextArea
            placeholder="Comments *"
            value={requestComments}
            onChange={(e) => setRequestComments(e.target.value)}
            rows={4}
          />
        </div>
      </AntdModal>

      {/* Reopen Modal */}
      <AntdModal
        title="Reopen Task"
        open={reviewModal === "reopen"}
        onOk={handleReopen}
        onCancel={() => { setReviewModal(null); setReopenReason(""); setReopenType("Bug Found"); }}
        confirmLoading={reopenTaskCall.loading}
        okText="Reopen"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Reopen Type *</label>
            <Select
              value={reopenType}
              onChange={setReopenType}
              style={{ width: "100%" }}
              options={[
                { value: "Client Feedback", label: "Client Feedback" },
                { value: "Bug Found", label: "Bug Found" },
                { value: "QA Failure", label: "QA Failure" },
                { value: "Requirement Missed", label: "Requirement Missed" },
                { value: "Change Request", label: "Change Request" },
                { value: "Other", label: "Other" },
              ]}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Reason *</label>
            <Input.TextArea
              placeholder="Why is this task being reopened?"
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </AntdModal>
    </div>
  );
});
const TaskDetail = React.memo(() => {
  const [fullScreen, setFullScreen] = useState(false);
  const [position] = useState("modal");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTask = searchParams.get("selected_task") || null;
  const copilot = searchParams.get("copilot") === "true";

  const task_details_query = useTaskDetailsQuery(selectedTask);

  const task = task_details_query.data || {};

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

  if (!selectedTask) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 ease-in-out ${
          fullScreen
            ? "w-full h-screen max-w-none rounded-none shadow-none"
            : "w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl"
        }`}
      >
        {task_details_query.isLoading ? (
          <TaskSkeleton />
        ) : (
          <>
            <TaskBody
              task={task}
              fullScreen={fullScreen}
              setFullScreen={setFullScreen}
            />
            <Drawer
              open={!!copilot}
              onClose={() => {
                searchParams.set("copilot", "false");
                setSearchParams(searchParams);
              }}
              size={"large"}
              styles={{
                body: { padding: 0 },
              }}
              // bodyStyle={{ padding: 0 }}
              // headerStyle={{ display: "none" }}
              closable={false}
            >
              <TaskCopilot />
            </Drawer>
          </>
        )}{" "}
      </div>
    </div>
  );
});

export default TaskDetail;
