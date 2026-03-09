import {
  useFrappeCreateDoc,
  useFrappeEventListener,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";
import { Send, Plus, Check } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Markdown from "react-markdown";
import { Button, Radio } from "antd";
import { useQueryParams } from "../hooks/useQueryParams";

function toLLMInput(task) {
  if (!task) return "";

  // Extract main task info
  const mainTask = {
    id: task.name,
    subject: task.subject,
    project: task.project,
    type: task.type,
    status: task.status,
    priority: task.priority,
    description: task.description
      ? task.description.replace(/<[^>]*>/g, "").trim()
      : "",
  };

  // Extract dependencies in readable form
  const dependencies = (task.depends_on || []).map((dep) => ({
    id: dep.task,
    subject: dep.subject,
  }));

  // Build LLM-friendly string
  let llmText = `Task: ${mainTask.subject} (ID: ${mainTask.id})
Project: ${mainTask.project}
Type: ${mainTask.type}
Status: ${mainTask.status}
Priority: ${mainTask.priority}
Description: ${mainTask.description}
Dependencies:`;

  if (dependencies.length) {
    dependencies.forEach((d) => {
      llmText += `\n  - ${d.subject} (ID: ${d.id})`;
    });
  } else {
    llmText += " None";
  }

  return llmText;
}

// Example usage
// const llmInput = toLLMInput(yourTaskJSON);
// console.log(llmInput);
const SuggestedSubTask = React.memo(({ subtask, message_id }) => {
  const [loading, setLoading] = useState(false);
  const check_task_exists_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.check_subtask_exists",
    {
      message_id: message_id,
      subject: subtask.subject,
    },
  );

  const create_subtask_from_ai_session = useFrappePostCall(
    "infintrix_atlas.api.v1.create_subtask_from_ai_session",
  );

  const task_already_exists = check_task_exists_query?.data?.message || false;

  return (
    <div
      key={subtask.id}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            {subtask.task_type}
          </span>
          {subtask.priority && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
              subtask.priority === "High" 
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : subtask.priority === "Medium"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}>
              {subtask.priority}
            </span>
          )}
        </div>
        <Button
          icon={task_already_exists ? <Check size={14} /> : <Plus size={14} />}
          loading={loading}
          disabled={task_already_exists}
          size="small"
          onClick={() => {
            setLoading(true);
            create_subtask_from_ai_session
              .call({
                subtask: subtask,
                message_id: message_id,
              })
              .then(() => {
                check_task_exists_query.mutate();
                setLoading(false);
              });
          }}
        />
      </div>
      <h5 className="font-black text-slate-900 dark:text-white text-xs mb-1">
        {subtask.subject}
      </h5>
      <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium mb-2">
        {subtask.description}
      </p>
      
      <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
        {subtask.estimated_hours && (
          <div><span className="font-bold text-slate-600 dark:text-slate-300">Effort:</span> {subtask.estimated_hours}h</div>
        )}
        {subtask.complexity && (
          <div><span className="font-bold text-slate-600 dark:text-slate-300">Complexity:</span> {subtask.complexity}</div>
        )}
        {subtask.suggested_role && (
          <div><span className="font-bold text-slate-600 dark:text-slate-300">Role:</span> {subtask.suggested_role}</div>
        )}
        {subtask.execution_order && (
          <div><span className="font-bold text-slate-600 dark:text-slate-300">Order:</span> #{subtask.execution_order}</div>
        )}
      </div>

      {subtask.required_skills && subtask.required_skills.length > 0 && (
        <div className="mb-2">
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Skills:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {subtask.required_skills.map((skill, i) => (
              <span key={i} className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
        "{subtask.reason}"
      </p>
    </div>
  );
});
const Message = React.memo(({ msg }) => {
  const qp = useQueryParams();

  const selected_task = qp.get("selected_task") || null;
  if (!msg) return null;
  let message_type = "plain_text";

  let parsedContent = msg.content;
  try {
    parsedContent =
      typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
    message_type = "json";
  } catch (error) {
    parsedContent = msg.content;
    message_type = "plain_text";
  }

  // console.log("Parsed message content:", parsedContent);

  return (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[85%] space-y-4">
        <div
          className={`p-4 rounded-3xl text-sm font-medium leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
        >
          {message_type === "plain_text" ? (
            parsedContent
          ) : (
            <Markdown>{parsedContent?.message}</Markdown>
          )}
        </div>

        {/* {
          parsedContent?.suggested_tasks && (
            <div className="grid gap-3">
              {parsedContent.suggested_tasks.map((task, j) => (
                <div
                  key={j}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                      {task.task_type}
                    </span>
                  </div>
                  <h5 className="font-black text-slate-900 dark:text-white text-xs mb-1">
                    {task.subject}
                  </h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
                    "{task.reason}"
                  </p>
                </div>
              ))}
            </div>
          )
        } */}

        {/* Breakdown Mode */}
        {parsedContent?.suggested_subtasks && (
          <div className="grid gap-3">
            {parsedContent.suggested_subtasks.map((sub, j) => (
              <SuggestedSubTask key={j} subtask={sub} message_id={msg.name} />
            ))}
          </div>
        )}

        {/* Improve Mode */}
        {msg.structured?.suggestions && (
          <div className="grid gap-3">
            {msg.structured.suggestions.map((sug, j) => (
              <div
                key={j}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm"
              >
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-bold">Original:</span> {sug.original}
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mb-2 font-bold">
                  <span>Improved:</span> {sug.improved}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                  {sug.reason}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Risk Mode */}
        {msg.structured?.risks && (
          <div className="grid gap-3">
            {msg.structured.risks.map((risk, j) => (
              <div
                key={j}
                className={`bg-white dark:bg-slate-800 border p-4 rounded-2xl shadow-sm ${risk.severity === "High" ? "border-red-300 dark:border-red-600" : "border-slate-200 dark:border-slate-700"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-black text-slate-900 dark:text-white text-xs">
                    {risk.risk}
                  </h5>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded ${risk.severity === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
                  >
                    {risk.severity}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Mitigation: {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Effort Mode */}
        {msg.structured?.estimate && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1">
                Estimated Effort: {msg.structured.estimate.estimated_hours}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Complexity:{" "}
                <span className="font-bold">
                  {msg.structured.estimate.complexity}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              {msg.structured.estimate.breakdown.map((phase, j) => (
                <div key={j} className="flex justify-between text-[10px]">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {phase.phase}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {phase.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
const TaskCopilot = React.memo(() => {
  const [mode, setMode] = useState("breakdown");
  const [input, setInput] = useState("");
  const [searchParams] = useSearchParams();
  const selectedTask = searchParams.get("selected_task") || null;
  const task_details_query = useFrappeGetDoc("Task", selectedTask || "");
  const task = task_details_query.data || {};
 
  const createMutation = useFrappeCreateDoc();
  const get_session_query = useFrappeGetCall(
    "infintrix_atlas.api.copilot.get_or_create_session",
    { reference_doctype: "Task", reference_name: selectedTask },
  );
  const copilot_session = get_session_query?.data?.message || {};
  const session_id = copilot_session.name || null;
  const session_messages_query = useFrappeGetDocList(
    "Copilot Message",
    {
      filters: [["session", "=", session_id]],
      orderBy: { field: "creation", order: "asc" },
      fields: ["*"],
    },
    session_id ? ["copilot_messages", session_id] : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useFrappeEventListener(session_id || null, (data) => {
    console.log("Received event for session:", session_id, data);

    isTyping && setIsTyping(false);

    if (data.record.role === "assistant") {
      session_messages_query.mutate(
        async (current) => {
          return [
            ...current,
            {
              ...data.record,
            },
          ];
        },
        {
          optimisticData: (current) => {
            return [...current, data.record];
          },
          rollbackOnError: true,
          revalidate: false,
          populateCache: true,
        },
      );
    }
  });
  const session_messages = session_messages_query?.data || [];

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session_messages_query?.data]);


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      session: session_id,
      role: "user",
      mode: mode,
      content: input,
      structured: {
        extra: "anything",
      },
    };
    session_messages_query.mutate(
      async (current) => {
        const newMessage = await createMutation.createDoc(
          "Copilot Message",
          userMessage,
        );
        return [
          ...current,
          {
            ...newMessage,
          },
        ];
      },
      {
        optimisticData: (current) => {
          return [...current, userMessage];
        },
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      },
    );
    setInput("");
    setIsTyping(true);

  };

  return (
    <div className="h-full flex flex-col border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-sm">
      <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Chat History */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900"
          ref={scrollRef}
        >
          {session_messages.map((msg, i) => (
            <Message key={i} msg={msg} session_id={session_id} />
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              Mode:
            </span>
                   <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
                <div className="flex gap-3 flex-wrap">
            {[
              "general",
              "create",
              "breakdown",
              "improve",
              "risk",
              "effort",
            ].map((option) => (
              <Radio key={option} value={option}>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {option === "general"
              ? "General"
              : option === "create"
                ? "Create Tasks"
                : option === "breakdown"
                  ? "Suggest Breakdown"
                  : option === "improve"
                    ? "Improve Description"
                    : option === "risk"
                ? "Analyze Risk"
                : "Estimate Effort"}
                </span>
              </Radio>
            ))}
                </div>
              </Radio.Group>
          </div>

          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Copilot for suggestions..."
              className="w-full pl-6 pr-14 py-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[20px] text-sm font-bold text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
            <button
              onClick={handleSend}
              disabled={createMutation.loading || !input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
export default TaskCopilot;
