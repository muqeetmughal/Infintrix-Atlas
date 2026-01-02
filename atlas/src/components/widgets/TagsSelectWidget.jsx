import { Select } from "antd";
import {
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";
import { useEffect, useState } from "react";

export const TagsSelectWidget = (props) => {
  const [selected, setSelected] = useState(props.value || []);

  const addTag = useFrappePostCall(
    "frappe.desk.doctype.tag.tag.add_tag"
  );
  const removeTag = useFrappePostCall(
    "frappe.desk.doctype.tag.tag.remove_tag"
  );

  const tagsList = useFrappeGetDocList("Tag", {
    fields: ["name"],
    limit_page_length: 100,
    order_by: "name asc",
  });

  // keep in sync if parent changes value
  useEffect(() => {
    setSelected(props.value || []);
  }, [props.value]);

  if (tagsList.isLoading) return null;

  return (
    <Select
      mode="tags"
      variant="borderless"
      placeholder="Labels"
      value={selected}
      style={{
        width : "100%"
      }}
      onChange={(values) => {
        setSelected(values);
        props.onChange?.(values);
      }}
      onSelect={(value) => {
        addTag.call({
          tag: value,
          dt: "Task",
          dn: props.docname,
        });
      }}
      onDeselect={(value) => {
        removeTag.call({
          tag: value,
          dt: "Task",
          dn: props.docname,
        });
      }}
      options={tagsList.data.map((t) => ({
        label: t.name,
        value: t.name,
      }))}
    />
  );
};

// import { Badge, Select, Tag } from "antd";
// import {
//   useFrappeGetCall,
//   useFrappeGetDocList,
//   useFrappePostCall,
// } from "frappe-react-sdk";
// import { useState } from "react";
// export const TagsSelectWidget = (props) => {
//   const [open, setOpen] = useState(false);
//   const [selected, setSelected] = useState(props.value || []);

//   const add_tag_mutation = useFrappePostCall("frappe.desk.doctype.tag.tag.add_tag");
//   const remove_tag_mutation = useFrappePostCall(
//     "frappe.desk.doctype.tag.tag.remove_tag"
//   );
//   const tags_list_query = useFrappeGetDocList("Tag", {
//     fields: ["name as const", "name as title"],
//     limit_page_length: 100,
//     order_by: "name asc",
//   });

//   const get_tags_query = useFrappePostCall(
//     "frappe.desk.doctype.tag.tag.get_tags"
//   );

//   if (tags_list_query.isLoading) return null;

//   return (
//     <Select
//       mode="multiple"
      
//       variant="borderless"
//       placeholder="Labels"
//       // tagRender={tagRender}
//       open={open}
//       onDropdownVisibleChange={(visible) => setOpen(visible)}
//       onSelect={() => setOpen(false)}
//       {...props}
//       value={selected}
//       onChange={(v) => {
//         console.log("Tags changed to", v);
//         setSelected(v);

//         // props.onChange && props.onChange(v);
//         add_tag_mutation.call({
//           tag: v[v.length - 1],
//           dt: "Task",
//           dn: props.docname,
//         });
//       }}
     
      
//       onDeselect={(value) => {
//         console.log("Deselect", value);
//         remove_tag_mutation.call({
//           tag: value,
//           dt: "Task",
//           dn: props.docname,
//         });
//       }}

//       // optionRender={(props) => (
//       //   <div className="flex items-center" style={{ width: "100%" }}>
//       //     <span>{props.label}</span>
//       //   </div>
//       // )}
//       // dropdownStyle={{ width: 300, overflowX: "auto" }}
//       // maxTagCount="responsive"
//     >
//       {tags_list_query?.data.map((option, index) => (
//         <Select.Option key={option.const || index} value={option.const}>
//           {option.title}
//         </Select.Option>
//       ))}
//     </Select>
//   );
// };
