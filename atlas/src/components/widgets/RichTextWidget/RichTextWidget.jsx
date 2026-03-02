import React, { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Button } from "antd";
import { useTheme } from "../../../context/ThemeContext";

const RichTextWidget = (props) => {
  const [value, setValue] = useState(props.value || "");
  const containerRef = React.useRef(null);
  const [editable, setEditable] = useState(false);
  const theme = useTheme();

  React.useEffect(() => {
    setEditable(false);
    setValue(props.value);
  }, [props.value]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setEditable(false);
      }
    };

    if (editable) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [editable]);

  const handleEdit = () => {
    setValue("");
    setEditable(true);
  };

  if (!props.value && !editable) {
    return (
      <p
        ref={containerRef}
        onClick={handleEdit}
        className="text-slate-400 cursor-text hover:bg-slate-50 p-2 -ml-2 rounded transition-colors"
      >
        Add Description...
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <style>{`
        .rtw-readonly .ql-container.ql-snow {
          border: none;
        }
        .rtw-readonly .ql-toolbar.ql-snow {
          display: none;
        }
        .rtw-readonly .ql-editor {
          padding: 0;
        }
        .ql-toolbar.ql-snow {
          background: ${theme.isDark ? "#f3f3f3" : "#f3f3f3"};
        }
      `}</style>

      <div
        ref={containerRef}
        className={editable ? "rtw-editing cursor-pointer" : "rtw-readonly cursor-pointer"}
        onClickCapture={() => !editable && setEditable(true)}
      >
        <ReactQuill
          className={editable ? "ql-editing" : "ql-readonly cursor-pointer p-2 -ml-2 rounded transition-colors"}
          modules={{
            toolbar: editable
              ? [
                  [{ header: [1, 2, 3, 4, false] }],
                  ["bold", "italic", "underline"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ]
              : false,
          }}
          readOnly={!editable || props.loading}
          value={value}
          onChange={(val) => {
            setValue(val);
            props.onChange?.(val);
          }}
        />
        {editable && (
          <div className="text-start">
            <Button
              loading={props.loading}
              type="primary"
              size="small"
              onClick={() => {
                props.onSubmit?.(value);
                setEditable(false);
              }}
            >
              Save
            </Button>
            <Button
              type="default"
              size="small"
              className="ml-1"
              onClick={() => {
                setValue(props.value);
                setEditable(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextWidget;

export const RichTextWidgetForm = (props) => (
  <ReactQuill
    theme="snow"
    value={props.value}
    onChange={(value) => props.onChange?.(value)}
    {...props}
  />
);
