import Badge from "../ui/Badge";
import { TASK_PRIORITY_COLORS } from "../../data/constants";
import {
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { useGetDoctypeField } from "../../hooks/doctype";
import { Select } from "antd";

const priorityIcons = {
  Low: <ChevronsDown size={12} />,
  Medium: <ChevronUp size={12} />,
  High: <ChevronsUp size={12} />,
  Urgent: <TriangleAlert size={12} />,
};

const PriorityWidget = (props) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);

  const priority_query = useGetDoctypeField("Task", "priority", "options");
  const { options } = priority_query.data || {};

  if (priority_query.isLoading) return "Loading";

  return (
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
      popupMatchSelectWidth={150}
      dropdownClassName="dark:bg-gray-800"
      className="dark:text-gray-200"
      maxTagCount="responsive"
    >
      {options.map((option) => (
        <Select.Option key={option} value={option}>
          <Badge className={TASK_PRIORITY_COLORS[option]}>
            <span className="flex items-center gap-1">
              <span>{priorityIcons[option]}</span>
              <span>{option}</span>
            </span>
          </Badge>
        </Select.Option>
      ))}
    </Select>
  );
};

export default PriorityWidget;
