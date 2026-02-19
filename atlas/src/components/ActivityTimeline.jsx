import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import { Typography } from "antd";
import AvatarGen from "./AvatarGen";
import { useAuth } from "../hooks/query";

dayjs.extend(relativeTime);

export default function ActivityTimeline({ task_id }) {
  const [commentText, setCommentText] = React.useState("");
  const auth = useAuth();

  console.log("auth", auth.currentUser);

  const versions_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.get_task_activity",
    { task: task_id },
  );
  const createMutation = useFrappeCreateDoc();

  function formatTaskActivity({ versions = [], comments = [] }) {
    const items = [];

    // ---- VERSIONS (field + child table changes) ----
    versions.forEach((v) => {
      let parsed;
      try {
        parsed = JSON.parse(v.data);
      } catch {
        return;
      }

      const who = v.owner === auth.currentUser ? "You" : v.owner;
      const time = v.creation;

      // Field changes
      (parsed.changed || []).forEach(([field, oldVal, newVal]) => {
        const label = field
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        items.push({
          id: `version-${time}-${field}`,
          type: "change",
          text: `${who} changed the value of ${label} from ${oldVal} to ${newVal}`,
          time,
        });
      });

      // Child table additions
      (parsed.added || []).forEach(([table]) => {
        if (table === "depends_on") {
          items.push({
            id: `version-${time}-depends_on`,
            type: "child-add",
            text: `${who} added 1 row to Dependent Tasks`,
            time,
          });
        }
      });
    });

    // ---- COMMENTS (Comment + Assigned + others) ----
    comments.forEach((c) => {
      // const who = c.owner === "Administrator" ? "You" : c.owner;
      const who = c.owner === auth.currentUser ? "You" : c.owner;
      if (c.comment_type === "Comment") {
        items.push({
          id: `comment-${c.creation}`,
          type: "comment",
          text: `${who} Commented: ${c.content}`,
          time: c.creation,
        });
      }

      if (c.comment_type === "Assigned") {
        items.push({
          id: `assigned-${c.creation}`,
          type: "assigned",
          text: c.content.replace(auth.currentUser, "You"),
          time: c.creation,
        });
      }
    });

    // ---- SORT (ERPNext style: newest first) ----
    return items.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }

  const handleAddComment = async (content) => {
    if (!content.trim()) return;

    try {
      await createMutation.createDoc("Comment", {
        reference_doctype: "Task",
        reference_name: task_id,
        comment_type: "Comment",
        content: content,
      });
      setCommentText("");
      versions_query.mutate();
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  const data = versions_query?.data?.message || {};

  const timeline = React.useMemo(() => formatTaskActivity(data), [data]);

  const [inputHeight, setInputHeight] = React.useState(40);

  const handleInputChange = (e) => {
    setCommentText(e.target.value);
    // Auto-grow height based on scrollHeight
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
    setInputHeight(Math.min(e.target.scrollHeight, 200));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(commentText);
    }
  };

  return (
    <div>
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex space-x-3">
          <div className="w-8 h-8 shrink-0 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm">
            <AvatarGen name={auth.user.name} enable_tooltip={false} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 bg-white dark:bg-slate-800">
              <textarea
                placeholder="Add a comment... (Shift+Enter for new line)"
                value={commentText}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={createMutation.isPending}
                style={{ height: inputHeight }}
                className="w-full outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 mb-4 bg-transparent resize-none overflow-y-auto"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  "🎉 Looks good!",
                  "👋 Need help?",
                  "⛔ This is blocked",
                  "✅ Mark as done",
                  "🚀 Ready to ship",
                  "💭 Let's discuss",
                  "🐛 Found a bug",
                  "📝 Needs review",
                ].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setCommentText(suggestion);
                        setInputHeight(40);
                      }}
                      disabled={createMutation.isPending}
                      className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ),
                )}
                <button
                  onClick={() => handleAddComment(commentText)}
                  disabled={createMutation.isPending || !commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 space-x-1 pl-1">
              <span className="font-bold">Pro tip:</span>
              <span>press</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400">
                Enter
              </span>
              <span>to submit</span>
            </div>
          </div>
        </div>
      </div>

      <Typography.Title level={4} className="mt-8">
        Activity
      </Typography.Title>

      {!timeline.length ? (
        <div style={{ opacity: 0.6 }}>No activity yet</div>
      ) : (
        <div style={{ paddingLeft: 12 }}>
          {timeline.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: 10,
                position: "relative",
                paddingBottom: 16,
              }}
            >
              {/* Dot + line */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#888",
                    marginTop: 6,
                  }}
                />
                {idx !== timeline.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 3,
                      width: 1,
                      height: "100%",
                      background: "#444",
                    }}
                  />
                )}
              </div>

              {/* Text */}
              <div>
                <div style={{ fontSize: 14 }}>{item.text}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {dayjs(item.time).fromNow()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
