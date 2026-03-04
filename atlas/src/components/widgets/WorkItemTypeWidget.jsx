import { Select, Spin } from "antd";
import React, { useState } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { TASK_TYPE_ICONS } from "../../data/constants";

const WorkItemTypeWidget = (props) => {
  const { show_icon = true, show_label = true } = props;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || null);
  const task_type_query = useFrappeGetDocList("Task Type", {
    fields: ["name", "custom_icon", "custom_color"],
    limit_page_length: 9999999,
  });
  const task_types = (task_type_query?.data || []).map((task_type) => {
    return {
      label: task_type.name,
      key: task_type.name,
      icon: TASK_TYPE_ICONS[task_type.name]
        ? React.createElement(TASK_TYPE_ICONS[task_type.name])
        : null,
      color: task_type.custom_color || "#000000",
    };
  });
  if (props.disabled) {
    const selected_type = task_types.find((t) => t.label === selected);
    return (
      <div className="flex items-center">
        {show_icon &&
          React.createElement(
            TASK_TYPE_ICONS[selected_type?.label] || TASK_TYPE_ICONS["Task"],
          )
        
        }
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

  const selected_type = task_types.find((t) => t.label === selected);

  return (
    <>
      {!open && selected_type ? (
        <div
          className="flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {React.createElement(
            TASK_TYPE_ICONS[selected_type.label] || TASK_TYPE_ICONS["Task"],
            { style: { color: selected_type.color } },
          )}
   
        </div>
      ) : (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            variant="borderless"
            {...props}
            open={open}
            onOpenChange={(visible) => setOpen(visible)}
            onSelect={() => setOpen(false)}
            value={selected}
            onChange={(v) => {
              setSelected(v);
              props.onChange && props.onChange(v);
            }}
            popupMatchSelectWidth={false}
          >
            {task_types.map((option) => (
              <Select.Option key={option.key} value={option.label}>
                {
                  React.createElement(
                    TASK_TYPE_ICONS[option.label] || TASK_TYPE_ICONS["Task"],
                    { style: { color: option.color } },
                  )
                }
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
        </div>
      )}
    </>
  );
};

export default WorkItemTypeWidget;
