import dayjs from "dayjs";
import {
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
} from "frappe-react-sdk";
import React from "react";

const CommentSection = ({ task_id }) => {
  const [commentText, setCommentText] = React.useState("");
  const comments_query = useFrappeGetDocList("Comment", {
    filters: [
      ["reference_doctype", "=", "Task"],
      ["reference_name", "=", task_id],
      ["comment_type", "=", "Comment"],
    ],
    fields: ["*"],
    order_by: "creation desc",
    limit_page_length: 20,
  });
  const createMutation = useFrappeCreateDoc();

  const comments = comments_query?.data || [];

  console.log("comments_query", comments_query.data);

  if (comments_query.isLoading) {
    return <div>Loading comments...</div>;
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
      comments_query.mutate();
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.name} className="flex items-start space-x-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {comment.comment_email
                ? comment.comment_email.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {comment.comment_email}
                </span>
                {comment.comment_type && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                    {comment.comment_type}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                <div
                  dangerouslySetInnerHTML={{
                    __html: comment.content,
                  }}
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {dayjs(comment.creation).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex space-x-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-cyan-600 dark:bg-cyan-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            MM
          </div>
          <div className="flex-1 space-y-3">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 bg-white dark:bg-slate-800">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 mb-4 bg-transparent"
              />
              <div className="flex flex-wrap gap-2">
                {["🎉 Looks good!", "👋 Need help?", "⛔ This is blocked"].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAddComment(suggestion)}
                      disabled={createMutation.isPending}
                      className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
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
                M
              </span>
              <span>to comment</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentSection;
