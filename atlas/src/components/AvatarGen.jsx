import React, { useState } from "react";
import { Avatar, Spin, theme, Tooltip, Typography } from "antd";
import PropTypes from "prop-types";
import { useAvatarQuery } from "../hooks/query";
import { useFrappeGetDoc } from "frappe-react-sdk";

const AvatarGen = ({ name = null, size = 30, enable_tooltip = false }) => {
  const [opened, setOpened] = useState(false);
  const avatar_query = useAvatarQuery(name);
  const { token } = theme.useToken();
  const shouldFetchUserDetails = name && name !== "unassigned" && name !== "auto";
  
  const user_detail_query = useFrappeGetDoc(
    "User", 
    name, 
    shouldFetchUserDetails ? ["current_user_details", name] : null, 
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  );

  if (avatar_query.isLoading && user_detail_query.isLoading) {
    return <Spin />;
  }

  const user_info = user_detail_query?.data || {};

  const TooltipRender = ({ user }) => {
    if (!user) {
      return "No data found";
    }

    return (
      <>
        {user?.user_image && (
          <>
            <img
              src={user?.user_image}
              alt="Avatar"
              width={100}
              height={100}
              className="rounded-full mb-2"
            />{" "}
            <br />
          </>
        )}

        <Typography.Title level={5} className="mb-0">
          {user?.full_name}
        </Typography.Title>
        <Typography.Text type="secondary" className="mb-2">
          {user?.email}
        </Typography.Text>
        <br />
        {/* {user?.first_name}{" "}{user?.last_name} */}
      </>
    );
  };

  if (enable_tooltip) {
    return (
      <Tooltip
        color={token.colorBgContainer}
        title={() => <TooltipRender user={user_info} />}
        onOpenChange={(open) => {
          if (open) {
            setOpened(true);
          } else {
            setOpened(false);
          }
        }}
      >
        <Avatar
        size="small"
          src={user_info?.user_image || avatar_query.data}
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
      size="small"
        src={user_info?.user_image || avatar_query.data}
        style={{ backgroundColor: "#87d068" }}
        className="cursor-pointer"
        // icon={<UserOutlined />}
      />
      // <img src={avatar_query.data} alt="Avatar" width={size} height={size} />
    );
  }
};
AvatarGen.propTypes = {
  name: PropTypes.string,
  size: PropTypes.number,
  enable_tooltip: PropTypes.bool,
};

export default AvatarGen;
