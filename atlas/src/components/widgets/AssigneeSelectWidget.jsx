import { Select, Tag } from "antd";
import { useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { useState } from "react";
import AvatarGen from "../AvatarGen";
// import AvatarGen from "../common/AvatarGen";
// import { useCollegueNamesQuery } from "../../queries/collegues";
export const AssigneeSelectWidget = (props) => {
  console.log("AssigneeSelectWidget props", props);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);

  const collegues_list_query = useFrappeGetDocList("User", {
    fields: ["name as const", "full_name as title"],
    filters: [["enabled", "=", 1]],
    limit_page_length: 50,
    order_by: "full_name asc",
  });


  const tagRender = (tag_props) => {
    const { label, value, closable, onClose } = tag_props;
    // return <AvatarGen id={value} name={label} enable_tooltip={true} />
    return String(label).includes("+") ? (
      label
    ) : (
      <AvatarGen id={value} name={label} enable_tooltip={true} />
    );
  };

  if (collegues_list_query.isLoading) return null;
  

  return (
    <Select
      mode="multiple"
      allowClear
      variant="borderless"
    //   className="min-w-24"
      placeholder="Assignees"
      tagRender={tagRender}
      open={open}
      onDropdownVisibleChange={(visible) => setOpen(visible)}
      onSelect={() => setOpen(false)}
      {...props}
      value={selected}
      onChange={(v)=>{
        setSelected(v);
       
        props.onChange && props.onChange(v);
      }}
      optionRender={(props) => (
        <div className="flex items-center" style={{ width: "100%" }}>
          <AvatarGen name={props.value} enable_tooltip={false} />
          <span className="ml-2">{props.label}</span>
        </div>
      )}
      dropdownStyle={{ width: 300, overflowX: "auto" }}
      maxTagCount="responsive"
    >
      {collegues_list_query?.data.map((option, index) => (
        <Select.Option key={option.const || index} value={option.const}>
          {option.title}
        </Select.Option>
      ))}
    </Select>
  );
};