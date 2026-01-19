import { Select, Spin } from "antd";
import React, { useState } from "react";
// import { LoadingOutlined } from '@ant-design/icons';
import { useFrappeGetDocList } from "frappe-react-sdk";
import { IconRenderer } from "../IconRenderer";

const WorkItemTypeWidget = (props) => {
  // const {
  // } = props
  const {
    show_icon = true,
    show_label = true,
  } = props;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || null);
  const task_type_query = useFrappeGetDocList("Task Type", {
    fields: ["name", "custom_icon", "custom_color"],
    limit_page_length: 100,
  });
  const task_types = (task_type_query?.data || []).map((task_type) => {
    return {
      label: task_type.name,
      key: task_type.name,
      icon: <IconRenderer name={task_type.custom_icon || "QuestionOutlined"} />,
      color: task_type.custom_color || "#000000",
    };
  });
  if (props.disabled) {
    const selected_type = task_types.find((t) => t.label === selected);
    return (
      <div className="flex items-center">
        {show_icon && (
          <IconRenderer
            name={
              selected_type?.icon
                ? selected_type.icon.props.name
                : "QuestionOutlined"
            }
            style={{ color: selected_type?.color }}
          />
        )}
        {show_label && (
          <span
            className="ml-2"
            style={{
              color: selected_type?.color,
            }}
          >
            {selected_type?.label}
          </span>
        )}
      </div>
    );
  }
  if (task_type_query.isLoading) return <Spin />;

  return (
    <>
      <Select
        variant="borderless"
        {...props}
        open={open}
        onDropdownVisibleChange={(visible) => setOpen(visible)}
        onSelect={() => setOpen(false)}
        value={selected}
        onChange={(v) => {
          setSelected(v);

          props.onChange && props.onChange(v);
        }}
        // optionRender={(props) => (
        //   <div className="flex items-center" style={{ width: "100%" }}>
        //     <span className="ml-2">{props.label}</span>
        //   </div>
        // )}
        dropdownStyle={{ width: 150, overflowX: "auto" }}
        // maxTagCount="responsive"
      >
        {task_types.map((option, index) => (
          <Select.Option key={option.key} value={option.label}>
            <IconRenderer
              name={option.icon ? option.icon.props.name : "QuestionOutlined"}
              style={{ color: option.color }}
            />
            <span
              className="ml-2"
              style={{
                color: option.color,
              }}
            >
              {option.label}
            </span>
          </Select.Option>
        ))}
      </Select>
    </>
  );
};

export default WorkItemTypeWidget;
