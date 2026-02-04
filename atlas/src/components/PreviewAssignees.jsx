import { Avatar } from "antd";
import React from "react";
import AvatarGen from "./AvatarGen";

const PreviewAssignees = ({ assignees = [],enable_tooltip=false }) => {

  return (
    <Avatar.Group>
      {assignees.map((assignee) => {
        return <AvatarGen name={assignee} enable_tooltip={enable_tooltip} />;
      })}
    </Avatar.Group>
  );
};

export default PreviewAssignees;
