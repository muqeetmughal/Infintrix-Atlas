import { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Button } from "antd";
import { X, Check } from "lucide-react";
const RichTextWidget = (props) => {
  console.log("RichTextWidget props.value", props.value);
  const [value, setValue] = useState(props.value || "");
  const [editable, setEditable] = useState(false);
  console.log("RichTextWidget props.value", editable);
  if (!props.value && !editable) {
    return (
      <p
        onClick={() => {
          setValue("");
          setEditable(true);
        }}
        className="text-slate-400 cursor-text hover:bg-slate-50 p-2 -ml-2 rounded transition-colors"
      >
        Add Description...
      </p>
    );
  }
  if (editable) {
    return (
      <>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={(value) => {
            setValue(value);
            props.onChange && props.onChange(value);
          }}
        />

        <div className="text-start">
          <Button
            type="primary"
            size="small"
            // icon={<Check />}
            onClick={() => {
              setValue(value);
              props.onChange && props.onChange(value);
              setEditable(false);
            }}
          >
            Save
          </Button>
          <Button
            type="default"
            size="small"
            // icon={<X />}
            onClick={() => {
              setValue(props.value);
              setEditable(false);
            }}
            className="mr-1"
          >
            Cancel
          </Button>
        </div>
      </>
    );
  }

  return (
    <div
      onClick={() => {
        setValue(props.value);
        setEditable(true);
      }}
      dangerouslySetInnerHTML={{
        __html: props.value,
      }}
    ></div>
  );
};

export default RichTextWidget;
