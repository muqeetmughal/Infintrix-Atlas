import { Select } from "antd";
import React, { useState } from "react";
import { useGetDoctypeField } from "../../hooks/doctype";
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS } from "../../data/constants";
import Badge from "../ui/Badge";

const StatusWidget = (props) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);

  const status_query = useGetDoctypeField("Task", "status", "options");
  const { options } = status_query.data || {};

  if (status_query.isLoading) return "Loading...";

  return (
    <div className="w-full">
      <Select
        variant="borderless"
        open={open}
        onOpenChange={(visible) => setOpen(visible)}
        onSelect={() => setOpen(false)}
        {...props}
        value={selected}
        onChange={(v) => {
          setSelected(v);
          props.onChange && props.onChange(v);
        }}
        // optionRender={(props) => (
        //   <div className="flex items-center dark:text-gray-200 w-full">
        //     <span className="ml-2">{props.label}</span>
        //   </div>
        // )}
        popupClasses="dark:bg-gray-800 w-full"
        className="w-full dark:text-gray-200"
        maxTagCount="responsive"
        style={{ width: "100%" }}
        popupMatchSelectWidth={false}
      >
        {options.map((option) => {
          if (option.trim() === "Template") return null;
          return (
            <Select.Option key={option} value={option}>
              <Badge className={`text-${TASK_STATUS_COLORS[option]}-600`}>
                <div className="flex justify-start items-center">
                  <span>
                    {React.createElement(TASK_STATUS_ICONS[option], {
                      size: 14,
                      className: `text-${TASK_STATUS_COLORS[option]}-600 mr-1`,
                    })}
                  </span>
                  <span>{option}</span>
                </div>
              </Badge>
            </Select.Option>
          );
        })}
      </Select>
    </div>
  );
};

export default StatusWidget;
