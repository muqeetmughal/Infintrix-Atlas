import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  theme,
} from "antd";
import { useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import React, { useState } from "react";
import AvatarGen from "../AvatarGen";
import { UserOutlined } from "@ant-design/icons";
import {
  useAssigneeOfTask,
  useAssigneeUpdateMutation,
} from "../../hooks/query";

export const AssigneeSelectWidget = (props) => {
  // console.log("AssigneeSelectWidget props:", props);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || []);
  const assignee_of_task_query = useAssigneeOfTask(props.task);
  const assignees_of_task = (assignee_of_task_query?.data || []).map((todo) => {
    return todo.allocated_to;
  });

  // console.log("Assignee of task query data:", assignees_of_task);

  const collegues_list_query = useFrappeGetDocList("User", {
    fields: ["name", "full_name"],
    filters: [
      ["enabled", "=", 1],
      ["name", "!=", "Guest"],
    ],
    limit_page_length: 50,
    order_by: "full_name asc",
  });
  const { token } = theme.useToken();

  const assignee_mutation = useAssigneeUpdateMutation();
  const contentStyle = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
  };
  const menuStyle = {
    boxShadow: "none",
  };

  // const tagRender = (tag_props) => {
  //   const { value, closable, onClose } = tag_props;
  //   if (!value) return null;
  //   return (
  //     <div
  //       style={{ marginRight: 8, marginBottom: 4 }}
  //       className="flex items-center gap-2 px-2 py-1"
  //     >
  //       <AvatarGen name={value} enable_tooltip={true} />

  //       {(props.show_label || true) && <span className="text-sm">{value}</span>}
  //     </div>
  //     // <Tag
  //     //   closable={closable}
  //     //   onClose={onClose}
  //     //   style={{ marginRight: 8, marginBottom: 4 }}
  //     //   className="flex items-center gap-2 px-2 py-1"
  //     // >
  //     //   <AvatarGen name={value} enable_tooltip={true} />

  //     //   {
  //     //     props.show_label && <span className="text-sm">{value}</span>
  //     //   }

  //     // </Tag>
  //   );
  // };

  if (collegues_list_query.isLoading) return <Spin />;

  const defaultOptions = [
    {
      name: "unassigned",
      full_name: "Unassigned",
    },
    {
      name: "auto",
      full_name: "Automatic",
    },
  ];

  const items = defaultOptions
    .concat(collegues_list_query?.data || [])
    .map((colleague) => {
      return {
        key: colleague.name,
        label: (
          <div className="flex items-center gap-2">
            <AvatarGen name={colleague.name} enable_tooltip={false} />
            <span>{colleague.full_name}</span>
          </div>
        ),
      };
    });

  const getNameByValue = (value) => {
    const user = collegues_list_query.data.find(
      (colleague) => colleague.name === value,
    );
    return user ? user.full_name : value;
  };
  return (
    <Dropdown
      disabled={props.disabled}
      menu={{
        items,
        selectedKeys: assignees_of_task.concat(selected),
        onClick: ({ key }) => {
          console.log("updateing assignee:", key);

          let newSelected = [];
          if (props.single) {
            newSelected = [key];
          } else {
            if (selected.includes(key)) {
              newSelected = selected.filter((s) => s !== key);
            } else {
              newSelected = [...selected, key];
            }
          }
          setSelected(newSelected);
          assignee_mutation
            .call({
              task_name: props.task,
              new_assignee: key,
            })
            .then(() => {
              assignee_of_task_query.mutate();
            });
        },
      }}
      trigger={["click"]}
      onOpenChange={(flag) => setOpen(flag)}
      open={open}
      popupRender={(menu) => (
        <div style={contentStyle}>
          <Space style={{ padding: 8 }}>
            <Input
              prefix={<Avatar size={24} icon={<UserOutlined />} />}
              placeholder=""
              style={{
                width: "100%",
              }}
            />
          </Space>
          <Divider style={{ margin: 0 }} />
          {React.cloneElement(menu, { style: menuStyle })}
        </div>
      )}
    >
      <Button size="small" type="text">
        {assignees_of_task.length > 0 ? (
          <div className="flex items-center -space-x-2">
            {assignees_of_task.map((assignee) => (
              <div key={assignee} className="inline-block">
                <AvatarGen name={assignee} enable_tooltip={false} />
              </div>
            ))}
            {props.show_label && (
              <span className="ml-3 text-sm">
                {assignees_of_task.length === 1
                  ? getNameByValue(assignees_of_task[0])
                  : `${assignees_of_task.length} assignees`}
              </span>
            )}
          </div>
        ) : (
          <>
          <Avatar size={24} icon={<UserOutlined />} /> {props.show_label && "Unassigned"}
          </>
        )}
      </Button>
    </Dropdown>
  );
};
