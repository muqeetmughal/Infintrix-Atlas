import { message } from "antd";

export function extractFrappeMessage(error) {
  if (!error) return "An unexpected error occurred";

  if (typeof error === "string") return error;

  if (error._server_messages) {
    try {
      const msgs = JSON.parse(error._server_messages);
      const parsed = JSON.parse(msgs[0]);
      if (parsed?.message) return parsed.message;
    } catch (_) {}
  }

  if (error.message) return error.message;
  if (error.exception) {
    const parts = error.exception.split(":");
    return parts[parts.length - 1]?.trim() || error.exception;
  }
  if (error.exc_type) return error.exc_type;

  return "An unexpected error occurred";
}

export function showFrappeError(error) {
  const msg = extractFrappeMessage(error);
  message.error(msg);
}
