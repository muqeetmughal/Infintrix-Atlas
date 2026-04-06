import { Input, Spin } from "antd";
import { useFrappeCreateDoc } from "frappe-react-sdk";
import { useEffect, useRef, useState } from "react";

const InlineTaskCreator = ({
  project_id,
  phase_id,
  cycle = null,
  onCreated,
  onCancel,
}) => {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const createMutation = useFrappeCreateDoc();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const createTask = async () => {
    if (!value.trim()) return;

    setLoading(true);
    try {
      const doc = await createMutation.createDoc("Task", {
        subject: value,
        project: project_id,
        custom_phase: phase_id,
        custom_cycle: cycle ? cycle : undefined,
        status: "Open",
      });

      onCreated?.(doc);
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl px-3 py-2 shadow-sm">
      <Input
        ref={inputRef}
        size="small"
        placeholder="What needs to be done?"
        value={value}
        disabled={loading}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={createTask}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        suffix={loading ? <Spin size="small" /> : null}
        variant="borderless"
        className="dark:text-slate-100 dark:placeholder-slate-400"
      />
    </div>
  );
};

export default InlineTaskCreator;