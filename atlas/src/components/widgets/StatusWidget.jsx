import { Select } from "antd";
import React, { useState } from "react";
import { useGetDoctypeField } from "../../hooks/doctype";
import { TASK_STATUS_COLORS } from "../../data/constants";
import Badge from "../ui/Badge";

const StatusWidget = (props) => {
  // const {
  // } = props
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);

  const status_query = useGetDoctypeField("Task", "status", "options");
  const { options } = status_query.data || {};

  if (status_query.isLoading) return "Loading";

  return (
    <>
      <Select
        variant="borderless"
        //   className="min-w-24"
        //   placeholder="Assignees"
        open={open}
        onDropdownVisibleChange={(visible) => setOpen(visible)}
        onSelect={() => setOpen(false)}
        {...props}
        value={selected}
        onChange={(v) => {
          setSelected(v);

          props.onChange && props.onChange(v);
        }}
        optionRender={(props) => (
          <div className="flex items-center" style={{ width: "100%" }}>
            <span className="ml-2">{props.label}</span>
          </div>
        )}
        dropdownStyle={{ width: 150, overflowX: "auto" }}
        maxTagCount="responsive"
      >
        {options.map((option, index) => (
          <Select.Option key={option} value={option}>
            <Badge className={TASK_STATUS_COLORS[option]}>
                {/* <span>{priorityIcons[option]}</span> */}
                <span>{option}</span>
            </Badge>
          </Select.Option>
        ))}
      </Select>
    </>
  );
};

export default StatusWidget;
