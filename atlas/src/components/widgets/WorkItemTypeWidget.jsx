import { Select } from "antd";
import React, { useState } from "react";
import { useGetDoctypeField } from "../../hooks/doctype";

const WorkItemTypeWidget = (props) => {
  // const {
  // } = props
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);

  const status_query = useGetDoctypeField("Task", "status", "options");
  console.log(status_query.data)

  if (status_query.isLoading) return "Loading"

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
          onChange={(v)=>{
            setSelected(v);
           
            props.onChange && props.onChange(v);
          }}
          optionRender={(props) => (
            <div className="flex items-center" style={{ width: "100%" }}>
              <span className="ml-2">{props.label}</span>
            </div>
          )}
          dropdownStyle={{ width: 300, overflowX: "auto" }}
          maxTagCount="responsive"
        >
          {status_query.data.map((option, index) => (
            <Select.Option key={option} value={option}>
              {option}
            </Select.Option>
          ))}
        </Select>
    </>
  );
};

export default WorkItemTypeWidget;
