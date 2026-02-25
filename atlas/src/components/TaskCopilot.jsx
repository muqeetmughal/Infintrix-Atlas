import {
  useFrappeCreateDoc,
  useFrappeEventListener,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
} from "frappe-react-sdk";
import { Send, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Markdown from 'react-markdown'

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
    description: task.description ? task.description.replace(/<[^>]*>/g, "").trim() : "",
  };

  // Extract dependencies in readable form
  const dependencies = (task.depends_on || []).map(dep => ({
    id: dep.task,
    subject: dep.subject
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
    dependencies.forEach(d => {
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
const Message = ({ msg }) => {
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
  console.log("Parsed Content:", parsedContent);
  // if (parsedContent == json) {
  //   msg.content = parsedContent;
  // }

  return (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[85%] space-y-4">
        <div
          className={`p-4 rounded-3xl text-sm font-medium leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
        >
          {message_type === "plain_text"
            ? parsedContent
            : <Markdown>{parsedContent?.message}</Markdown>}
        </div>

        {
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
                    {/* Add button or actions for the suggested task */}
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
        }

        {/* Breakdown Mode */}
        {parsedContent?.suggested_subtasks && (
          <div className="grid gap-3">
            {parsedContent.suggested_subtasks.map((sub, j) => (
              <div
                key={j}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {sub.task_type}
                  </span>
                  <button
                    onClick={() => onAddSubtask(sub)}
                    className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <h5 className="font-black text-slate-900 dark:text-white text-xs mb-1">
                  {sub.subject}
                </h5>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
                  "{sub.reason}"
                </p>
              </div>
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
};
const TaskCopilot = ({ onAddSubtask }) => {
  const [mode, setMode] = useState("general");
  const [input, setInput] = useState("");
  const [searchParams] = useSearchParams();
  const selectedTask = searchParams.get("selected_task") || null;
  const task_details_query = useFrappeGetDoc("Task", selectedTask || "");
  const task = task_details_query.data || {};
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your Task Copilot. I understand this is a **${task.type}**. How can I assist you with "${task.subject}"?`,
      structured: null,
    },
  ]);
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

  console.log("task:", task);
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
  const demo_session_messages = [
    {
      name: "hmpjtkqid2",
      owner: "Administrator",
      creation: "2026-02-23 08:18:45.777467",
      modified: "2026-02-23 08:18:45.777467",
      modified_by: "Administrator",
      docstatus: 0,
      idx: 0,
      session: "kec8jkgo2a",
      role: "user",
      content: "HI",
      mode: "breakdown",
      sequence: 1,
      doctype: "Copilot Message",
    },
    {
      content: [
        [
          "suggested_subtasks",
          [
            [
              ["subject", "Define project scope"],
              ["task_type", "Task"],
              [
                "reason",
                "To establish clear boundaries and deliverables for the project.",
              ],
            ],
            [
              ["subject", "Identify stakeholders"],
              ["task_type", "Task"],
              [
                "reason",
                "To ensure all relevant parties are involved and informed throughout the project.",
              ],
            ],
            [
              ["subject", "Create a project timeline"],
              ["task_type", "Task"],
              [
                "reason",
                "To outline key milestones and deadlines for project completion.",
              ],
            ],
            [
              ["subject", "Allocate resources"],
              ["task_type", "Sub-Task"],
              [
                "reason",
                "To ensure that all necessary resources (human, financial, material) are available for the project.",
              ],
            ],
            [
              ["subject", "Develop a risk management plan"],
              ["task_type", "Task"],
              [
                "reason",
                "To identify potential risks and create strategies to mitigate them.",
              ],
            ],
            [
              ["subject", "Set up communication plan"],
              ["task_type", "Task"],
              [
                "reason",
                "To establish how information will be shared among stakeholders.",
              ],
            ],
            [
              ["subject", "Conduct a kickoff meeting"],
              ["task_type", "Task"],
              [
                "reason",
                "To officially start the project and align all team members on objectives.",
              ],
            ],
            [
              ["subject", "Monitor project progress"],
              ["task_type", "Sub-Task"],
              [
                "reason",
                "To track the project's advancement and make adjustments as needed.",
              ],
            ],
            [
              ["subject", "Prepare final project report"],
              ["task_type", "Sub-Task"],
              [
                "reason",
                "To document outcomes, lessons learned, and recommendations for future projects.",
              ],
            ],
            [
              ["subject", "Conduct project closure meeting"],
              ["task_type", "Task"],
              [
                "reason",
                "To formally close the project and gather feedback from stakeholders.",
              ],
            ],
          ],
        ],
      ],
      creation: "2026-02-23 08:18:51.335234",
      docstatus: 0,
      doctype: "Copilot Message",
      idx: 0,
      mode: "breakdown",
      modified: "2026-02-23 08:18:51.335234",
      modified_by: "Administrator",
      name: "hoid2gujbr",
      owner: "Administrator",
      role: "assistant",
      sequence: 2,
      session: "kec8jkgo2a",
    },
  ];
  console.log("Session Messages:", session_messages);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session_messages_query?.data]);

  const DescriptionRender = ({ text }) => {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: text,
        }}
      />
    );
  };

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

    // setMessages((prev) => [...prev, userMessage]);

    // setInput("");
    // createMutation.createDoc("Copilot Message", userMessage).then((res) => {
    //     // session_messages_query.mutate();
    // });

    // setTimeout(() => {
    //   let aiResponse = {
    //     role: "assistant",
    //     content: "",
    //     structured: null,
    //   };

    //   if (mode === "breakdown") {
    //     aiResponse.content =
    //       "Based on the task requirements, I recommend the following subtasks to ensure structural integrity.";
    //     aiResponse.structured = {
    //       suggested_subtasks: [
    //         {
    //           subject: `Validate ${task.subject} Requirements`,
    //           task_type: "Sub-Task",
    //           reason: "Ensures baseline alignment before execution.",
    //         },
    //         {
    //           subject: `Draft Technical Architecture for ${task.id}`,
    //           task_type: "Sub-Task",
    //           reason: "Required for technical review.",
    //         },
    //       ],
    //     };
    //   } else if (mode === "improve") {
    //     aiResponse.content =
    //       "Here's an improved version of your task description:";
    //     aiResponse.structured = {
    //       suggestions: [
    //         {
    //           original: task.subject,
    //           improved: `${task.subject} - with clear acceptance criteria`,
    //           reason: "More specific and measurable.",
    //         },
    //         {
    //           original: (
    //             <DescriptionRender
    //               text={task.description || "No description"}
    //             />
    //           ),
    //           improved: "Add detailed steps and expected outcomes",
    //           reason: "Improves clarity for team members.",
    //         },
    //       ],
    //     };
    //   } else if (mode === "risk") {
    //     aiResponse.content =
    //       "Here are the potential risks identified for this task:";
    //     aiResponse.structured = {
    //       risks: [
    //         {
    //           risk: "Scope Creep",
    //           severity: "Medium",
    //           mitigation: "Define clear acceptance criteria upfront.",
    //         },
    //         {
    //           risk: "Resource Constraints",
    //           severity: "High",
    //           mitigation: "Allocate buffer time and validate availability.",
    //         },
    //         {
    //           risk: "Technical Complexity",
    //           severity: "Medium",
    //           mitigation: "Conduct architecture review with team.",
    //         },
    //       ],
    //     };
    //   } else if (mode === "effort") {
    //     aiResponse.content =
    //       "Based on the task complexity, here's my effort estimation:";
    //     aiResponse.structured = {
    //       estimate: {
    //         estimated_hours: "8-16 hours",
    //         complexity: "Medium",
    //         breakdown: [
    //           { phase: "Planning & Design", hours: "2-4" },
    //           { phase: "Implementation", hours: "4-8" },
    //           { phase: "Testing & Review", hours: "2-4" },
    //         ],
    //       },
    //     };
    //   }

    //   setMessages((prev) => [...prev, aiResponse]);
    //   setIsLoading(false);
    // }, 1500);
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
            <Message key={i} msg={msg} />
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
          <div className="flex items-center gap-3 mb-2">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="general">General</option>
              <option value="create">Create Tasks</option>
              <option value="breakdown">Suggest Breakdown</option>
              <option value="improve">Improve Description</option>
              <option value="risk">Analyze Risk</option>
              <option value="effort">Estimate Effort</option>
            </select>
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase italic">
              / Context: {task.task_type}
            </span>
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
};
export default TaskCopilot;
