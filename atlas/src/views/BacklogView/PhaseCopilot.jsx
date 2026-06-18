import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFrappeGetCall, useFrappePostCall, useFrappeFileUpload } from "frappe-react-sdk";
import { BrainCircuit, Loader2, Sparkles, Check, X, Send, Paperclip, FileText, Upload, AlertCircle } from "lucide-react";
import { Modal, message } from "antd";

const PhaseCopilot = ({ open, phase, project, onClose }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const runPipeline = useFrappePostCall("infintrix_atlas.api.ai_pipeline.run_phase_pipeline");
  const createTasksCall = useFrappePostCall("infintrix_atlas.api.ai.create_from_ai");
  const fileUpload = useFrappeFileUpload();
  const createResource = useFrappePostCall("infintrix_atlas.api.v1.create_project_resource");
  const getOrCreateSession = useFrappePostCall("infintrix_atlas.api.ai_pipeline.create_or_get_chat_session");
  const saveMsg = useFrappePostCall("infintrix_atlas.api.ai_pipeline.save_chat_message");
  const getMsgs = useFrappePostCall("infintrix_atlas.api.ai_pipeline.get_chat_messages");

  const resourcesQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_resources",
    { project: project, include_internal: true },
    project ? ["project_resources_phase", project] : null,
  );
  const resources = resourcesQuery?.data?.message || [];

  const persistMessage = useCallback(async (role, text) => {
    if (!sessionId) return;
    try {
      await saveMsg.call({ session: sessionId, role, text });
    } catch { /* ignore */ }
  }, [sessionId, saveMsg]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!drafts.length) return;

    setChatMessages(prev => {
      const next = [...prev];
      const lastTaskMessageIndex = [...next].reverse().findIndex(msg => Array.isArray(msg.taskSnapshot));
      if (lastTaskMessageIndex === -1) return prev;

      const targetIndex = next.length - 1 - lastTaskMessageIndex;
      next[targetIndex] = { ...next[targetIndex], taskSnapshot: drafts };
      return next;
    });
  }, [drafts]);

  // On open: get/create session + load messages
  useEffect(() => {
    if (!open || !project || !phase?.name) return;
    setLoading(true);
    setChatMessages([]);
    setDrafts([]);
    setShowReview(false);
    setShowResources(false);
    setSelectedResources([]);
    setPrompt("");
    setGenerating(false);
    setCreating(false);

    getOrCreateSession.call({ project, phase: phase.name }).then(async (res) => {
      const sid = res.message;
      setSessionId(sid);
      const msgsRes = await getMsgs.call({ session: sid });
      const msgs = msgsRes.message || [];
      if (msgs.length === 0) {
        const welcome = `I'm your AI architect for **${phase?.title || "this phase"}**. Describe what tasks need to be created and I'll generate them.\n\nYou can also attach resources from Project Resources for context, or upload new documents.`;
        setChatMessages([{ role: "assistant", text: welcome }]);
        // persist welcome message
        try { await saveMsg.call({ session: sid, role: "assistant", text: welcome }); } catch {}
      } else {
        setChatMessages(msgs);
        const latestTaskMessage = [...msgs].reverse().find(msg => Array.isArray(msg.taskSnapshot) && msg.taskSnapshot.length > 0);
        if (latestTaskMessage) {
          setDrafts(latestTaskMessage.taskSnapshot);
          setShowReview(true);
        }
      }
    }).catch(() => {
      setChatMessages([{ role: "assistant", text: "Failed to initialize chat session." }]);
    }).finally(() => setLoading(false));
  }, [open, project, phase?.name]);

  const addMessage = (role, text, extra = {}) => {
    setChatMessages(prev => [...prev, { role, text, ...extra }]);
    persistMessage(role, text);
  };

  const addLocalMessage = (role, text, extra = {}) => {
    setChatMessages(prev => [...prev, { role, text, ...extra }]);
  };

  const renderTaskCards = (taskList) => (
    <div className="space-y-2 mt-3">
      {taskList.map(d => (
        <div
          key={d.id}
          onClick={() => { if (!d.creationStatus) toggleDraft(d.id); }}
          className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
            d.creationStatus === "SUCCESS"
              ? "border-emerald-300 bg-emerald-50/60 opacity-65 cursor-default"
              : d.creationStatus === "DUPLICATE"
              ? "border-amber-300 bg-amber-50/60 opacity-65 cursor-default"
              : d.creationStatus === "FAILED"
              ? "border-red-400 bg-red-50/80 cursor-default"
              : d.status === "APPROVED"
              ? "border-indigo-400 bg-indigo-50/80 cursor-pointer"
              : "border-slate-200 hover:border-slate-300 cursor-pointer bg-white/80"
          }`}
        >
          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            d.creationStatus === "SUCCESS" ? "border-emerald-500 bg-emerald-500" :
            d.creationStatus === "DUPLICATE" ? "border-amber-500 bg-amber-500" :
            d.creationStatus === "FAILED" ? "border-red-500 bg-red-500" :
            d.status === "APPROVED" ? "border-indigo-600 bg-indigo-600" :
            d.validation?.valid === false ? "border-red-300" :
            "border-slate-300"
          }`}>
            {d.creationStatus === "SUCCESS" && <Check size={12} className="text-white" />}
            {d.creationStatus === "DUPLICATE" && <AlertCircle size={12} className="text-white" />}
            {d.creationStatus === "FAILED" && <X size={12} className="text-white" />}
            {d.status === "APPROVED" && !d.creationStatus && <Check size={12} className="text-white" />}
            {d.validation?.valid === false && !d.status && !d.creationStatus && <X size={12} className="text-slate-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{d.subject}</p>
              {d.creationStatus === "DUPLICATE" && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Duplicate</span>}
              {d.validation?.errors?.some(e => e.includes("Duplicate")) && !d.creationStatus && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Possible Duplicate</span>
              )}
            </div>
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                d.priority === "High" || d.priority === "Urgent" ? "bg-red-100 text-red-700" :
                d.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
              }`}>{d.priority}</span>
              <span className="text-[10px] text-slate-400">Weight: {d.weight}</span>
              {d.confidence != null && <span className="text-[10px] text-slate-400">Conf: {Math.round(d.confidence * 100)}%</span>}
            </div>
            {d.validation?.errors?.filter(e => !e.includes("Duplicate")).length > 0 && !d.creationStatus && (
              <p className="text-[10px] text-red-500 mt-1">{d.validation.errors.filter(e => !e.includes("Duplicate")).join(", ")}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const toggleResource = (r) => {
    setSelectedResources(prev =>
      prev.find(x => x.name === r.name)
        ? prev.filter(x => x.name !== r.name)
        : [...prev, r]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fileUpload.upload(file, { doctype: "Project Resource", docname: "temp" });
      const fileUrl = res.file_url;
      await createResource.call({
        project: project,
        phase: phase?.name,
        title: file.name,
        file_url: fileUrl,
        link: null,
        visibility: "Internal",
      });
      await resourcesQuery.mutate();
      addMessage("assistant", `**${file.name}** uploaded to Project Resources and ready for context.`);
      message.success(`${file.name} uploaded`);
    } catch {
      message.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating || !sessionId) return;
    const userPrompt = prompt.trim();
    const contextResources = [...selectedResources];

    let resourceNote = "";
    if (contextResources.length) {
      resourceNote = `\n*(Using ${contextResources.length} resource(s) as context)*`;
    }
    addLocalMessage("user", userPrompt + resourceNote);
    setPrompt("");
    setGenerating(true);
    setShowReview(false);
    setDrafts([]);

    try {
      const res = await runPipeline.call({
        project: project,
        phase: phase?.name,
        prompt: userPrompt,
        session: sessionId,
        resource_context: JSON.stringify(contextResources.map(r => r.name)),
        context_resources: JSON.stringify(contextResources.map(r => ({
          title: r.title,
          type: r.type,
          description: r.link || r.file || "",
        }))),
      });
      const data = res.message || {};

      if (data.status === "BLOCKED" || data.status === "FAILED") {
        addMessage("assistant", `Pipeline blocked: ${data.reason || "Unknown"}`);
      } else {
        const draftList = data.drafts || [];
        setDrafts(draftList);
        setShowReview(true);
        const validCount = draftList.filter(d => d.validation?.valid !== false).length;
        const dupCount = draftList.filter(d => d.validation?.errors?.some(e => e.includes("Duplicate"))).length;
        let summary = `Generated **${draftList.length} task(s)** for review.`;
        if (dupCount > 0) summary += ` ${dupCount} identified as potential duplicates.`;
        if (validCount > 0) summary += ` **${validCount}** ready to create.`;
        addMessage("assistant", summary, { taskSnapshot: draftList });
      }
    } catch (e) {
      addMessage("assistant", `Error: ${e.message || "Something went wrong"}`);
    } finally {
      setGenerating(false);
    }
  };

  const toggleDraft = (id) => {
    setDrafts(prev => prev.map(d =>
      d.id === id ? { ...d, status: d.status === "APPROVED" ? "PENDING" : "APPROVED" } : d
    ));
  };

  const handleCreate = async () => {
    const approved = drafts.filter(d => d.status === "APPROVED");
    if (!approved.length) { message.warning("Approve at least one task"); return; }
    setCreating(true);
    try {
      const res = await createTasksCall.call({
        tasks: approved.map(d => ({
          id: d.id,
          subject: d.subject,
          description: d.description || "",
          priority: d.priority,
          weight: d.weight,
          confidence: d.confidence,
          session: sessionId,
        })),
        project: project,
        phase: phase?.name,
      });
      const results = res.message || [];
      const success = results.filter(r => r.status === "SUCCESS").length;
      const duplicates = results.filter(r => r.status === "DUPLICATE").length;
      let summary = `Created **${success}** task(s) in **${phase?.title}**`;
      if (duplicates > 0) summary += ` (${duplicates} duplicates skipped)`;
      summary += "!";
      const updatedDrafts = drafts.map(d => {
        const result = results.find(r => r.id === d.id);
        if (!result) return d;
        return {
          ...d,
          creationStatus: result.status === "SUCCESS" ? "SUCCESS" : result.status === "DUPLICATE" ? "DUPLICATE" : "FAILED",
        };
      });
      addMessage("assistant", summary, { taskSnapshot: updatedDrafts });
      message.success(`Created ${success} tasks${duplicates ? `, ${duplicates} duplicates skipped` : ""}`);
      setDrafts(updatedDrafts);
    } catch (e) {
      addMessage("assistant", `Error creating tasks: ${e.message}`);
      message.error("Failed to create tasks");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-indigo-600" />
          <span>AI Architect — {phase?.title || "Phase"}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={null}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex flex-col" style={{ height: 560 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-[4px]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-[4px]"
                  }`}>
                    {msg.text}
                    {msg.taskSnapshot?.length > 0 && renderTaskCards(msg.taskSnapshot)}
                  </div>
                </div>
              ))}

              {/* Generation progress */}
              {generating && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-[4px] px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Analyzing, drafting, and validating…</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resource panel */}
              {showResources && !generating && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Project Resources</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        Upload
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                      <button onClick={() => setShowResources(false)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  {resources.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No resources yet. Upload one above.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {(() => {
                        const phaseResources = resources.filter(r => r.phase === phase?.name);
                        const otherResources = resources.filter(r => r.phase !== phase?.name);
                        return (
                          <>
                            {phaseResources.length > 0 && (
                              <>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider px-1 pt-1 pb-0.5">{phase?.title} Resources</p>
                                {phaseResources.map(r => {
                                  const isSelected = selectedResources.find(x => x.name === r.name);
                                  return (
                                    <button
                                      key={r.name}
                                      onClick={() => toggleResource(r)}
                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-all ${
                                        isSelected
                                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                                      }`}
                                    >
                                      <FileText size={12} className="shrink-0" />
                                      <span className="truncate flex-1">{r.title}</span>
                                      <span className="text-[9px] font-bold text-slate-400 shrink-0">{r.type}</span>
                                    </button>
                                  );
                                })}
                              </>
                            )}
                            {otherResources.length > 0 && (
                              <>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-2 pb-0.5">Other Resources</p>
                                {otherResources.map(r => {
                                  const isSelected = selectedResources.find(x => x.name === r.name);
                                  return (
                                    <button
                                      key={r.name}
                                      onClick={() => toggleResource(r)}
                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-all ${
                                        isSelected
                                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                                      }`}
                                    >
                                      <FileText size={12} className="shrink-0" />
                                      <span className="truncate flex-1">{r.title}</span>
                                      <span className="text-[9px] font-bold text-slate-400 shrink-0">{r.type}</span>
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {selectedResources.length > 0 && (
                    <p className="text-[10px] text-indigo-600 font-medium">{selectedResources.length} selected as context</p>
                  )}
                </div>
              )}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input + Actions */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-lg">
          {showReview && !generating && !creating && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDrafts(prev => prev.map(d => ({
                  ...d,
                  status: d.validation?.valid !== false ? "APPROVED" : d.status,
                })))}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Approve Valid
              </button>
              <button
                onClick={handleCreate}
                disabled={!drafts.some(d => d.status === "APPROVED")}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Create Tasks
              </button>
            </div>
          )}
          {creating && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Creating tasks…
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowResources(!showResources)}
              disabled={generating || creating}
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                showResources
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
              }`}
              title="Attach resources"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={loading ? "Loading…" : generating ? "Generating…" : "Describe the tasks for this phase…"}
              disabled={loading || generating || creating}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading || generating || creating}
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PhaseCopilot;
