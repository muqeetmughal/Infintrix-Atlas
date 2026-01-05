import React, { useState } from "react";
import { Avatar, Spin, theme, Tooltip, Typography } from "antd";
import PropTypes from "prop-types";
import { useAvatarQuery } from "../hooks/query";
import { useFrappeGetDoc } from "frappe-react-sdk";

const AvatarGen = ({
  id = null,
  name = null,
  size = 30,
  enable_tooltip = false,
}) => {
  const [opened, setOpened] = useState(false);
  const avatar_query = useAvatarQuery(name);
  const { token } = theme.useToken();

  const user_detail_query = useFrappeGetDoc("User", name);

  if (avatar_query.isLoading && user_detail_query.isLoading) {
    return <Spin />;
  }

  const user_info = user_detail_query?.data || {};

  const TooltipRender = ({
    user
  }) => {

 
    if (!user) {
      return "No data found";
    }

    return (
      <>
        {/* <AvatarGen id={id} name={name} size={100} enable_tooltip={false} />
        <br /> */}
        {user?.first_name}{" "}{user?.last_name}
      </>
    );
  };

  if (enable_tooltip) {
    return (
      <Tooltip
        color={token.colorBgContainer}
        title={() => <TooltipRender  user={user_info} />}
        onOpenChange={(open) => {
          if (open) {
            setOpened(true);
          } else {
            setOpened(false);
          }
        }}
      >
        <Avatar
          src={avatar_query.data}
          style={{ backgroundColor: "#87d068" }}
          className="cursor-pointer"
          // icon={<UserOutlined />}
        />
        {/* <img
          src={avatar_query.data}
          alt="Avatar"
          width={size}
          height={size}
          className="cursor-pointer"
        /> */}
      </Tooltip>
    );
  } else {
    return (
      <Avatar
          src={avatar_query.data}
          style={{ backgroundColor: "#87d068" }}
          className="cursor-pointer"
          // icon={<UserOutlined />}
        />
      // <img src={avatar_query.data} alt="Avatar" width={size} height={size} />
    );
  }
};
AvatarGen.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number,
  enable_tooltip: PropTypes.bool,
};

export default AvatarGen;
