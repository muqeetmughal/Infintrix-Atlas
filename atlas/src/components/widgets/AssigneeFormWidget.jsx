import { Select, Tag } from "antd";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useState } from "react";
import AvatarGen from "../AvatarGen";
export const AssigneeFormWidget = (props) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);

  const collegues_list_query = useFrappeGetDocList("User", {
    fields: ["name as const", "full_name as title"],
    filters: [["enabled", "=", 1], ["name", "!=", "Guest"]],
    limit_page_length: 50,
    order_by: "full_name asc",
  });

  const tagRender = (tag_props) => {
    const { value, closable, onClose } = tag_props;
    if (!value) return null;
    return (
      <Tag
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 8, marginBottom: 4 }}
        className="flex items-center gap-2 px-2 py-1"
      >
        <AvatarGen name={value} enable_tooltip={true} />
        <span className="text-sm">{value}</span>

      </Tag>
    );
  };

  if (collegues_list_query.isLoading) return null;

  return (
    <Select
      mode="multiple"
      allowClear
      variant="borderless"
      className="min-w-24"
      placeholder="Assignees"
      tagRender={tagRender}
      // open={open}
      // onOpenChange={(visible) => setOpen(visible)}
      onSelect={() => setOpen(false)}
      {...props}
      value={selected}
      onChange={(v) => {
        setSelected(v);
        props.onChange && props.onChange(v);
      }}
      optionRender={(props) => (
        <div className="flex items-center" style={{ width: "100%" }}>
          <AvatarGen name={props.value} enable_tooltip={false} />
          <span className="ml-2">{props.label}</span>
        </div>
      )}
      popupMatchSelectWidth={false}
      popupStyle={{ width: 300, overflowX: "auto", maxHeight: 400 }}
      maxTagCount={Number.MAX_SAFE_INTEGER}
      maxCount={props.single ? 1 : undefined}
    >
      {collegues_list_query?.data.map((option, index) => (
        <Select.Option key={option.const || index} value={option.const}>
          {option.title}
        </Select.Option>
      ))}
    </Select>
  );
};
