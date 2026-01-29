import { Select } from "antd";
import { useState } from "react";
import { useGetDoctypeField } from "../../hooks/doctype";
import { TASK_STATUS_COLORS } from "../../data/constants";
import Badge from "../ui/Badge";

const StatusWidget = (props) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);

  const status_query = useGetDoctypeField("Task", "status", "options");
  const { options } = status_query.data || {};

  if (status_query.isLoading) return "Loading";

  return (
    <>
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
        optionRender={(props) => (
          <div className="flex items-center dark:text-gray-200" style={{ width: "100%" }}>
            <span className="ml-2">{props.label}</span>
          </div>
        )}
        popupClassName="dark:bg-gray-800"
        className="dark:text-gray-200"
        maxTagCount="responsive"
      >
        {options.map((option) => (
          <Select.Option key={option} value={option}>
            <Badge className={TASK_STATUS_COLORS[option]}>
                <span>{option}</span>
            </Badge>
          </Select.Option>
        ))}
      </Select>
    </>
  );
};

export default StatusWidget;
