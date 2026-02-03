import { Select, Tag } from "antd";
import {
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";
import { useEffect, useState } from "react";

export const TagsSelectWidget = (props) => {
  const [selected, setSelected] = useState(props.value || []);
  const [tagColors, setTagColors] = useState(() => {
    const saved = localStorage.getItem("tagColors");
    return saved ? JSON.parse(saved) : {};
  });

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

  // persist tagColors to localStorage
  useEffect(() => {
    localStorage.setItem("tagColors", JSON.stringify(tagColors));
  }, [tagColors]);

  if (tagsList.isLoading) return null;

  const colors = [
    "red",
    "blue",
    "green",
    "cyan",
    "magenta",
    "orange",
    "purple",
    "geekblue",
    "gold",
  ];

  const getOrAssignColor = (tagName) => {
    if (tagColors[tagName]) {
      return tagColors[tagName];
    }
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    setTagColors((prev) => ({
      ...prev,
      [tagName]: newColor,
    }));
    return newColor;
  };

  return (
    <Select
      mode="tags"
      variant="borderless"
      placeholder="Labels"
      value={selected}
      style={{
        width: "100%",
      }}
      onChange={(values) => {
        setSelected(values);
        props.onChange?.(values);
      }}
      onSelect={(value) => {
        getOrAssignColor(value);
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
      tagRender={(props) => (
        <Tag color={getOrAssignColor(props.label)} {...props}>
          {props.label}
        </Tag>
      )}
    />
  );
};
