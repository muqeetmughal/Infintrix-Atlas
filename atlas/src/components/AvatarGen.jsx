import React, { useState } from "react";
import { Spin, theme, Tooltip, Typography } from "antd";
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


  if (avatar_query.isLoading) {
    return <Spin />;
  }

  const TooltipRender = () => {
    const user_info = user_detail_query.data || {};
    
    if (user_detail_query.isLoading) {
      return <Spin />;
    }

    if (!user_detail_query.data?.data?.success) {
      return "No data found";
    }

    return (
      <>
        <AvatarGen id={id} name={name} size={100} enable_tooltip={false} />
        <br />
        {user_info?.first_name && (
          <>
            <Typography.Text>
              First Name : {user_info?.first_name}{" "}
            </Typography.Text>
            <br />
          </>
        )}
        {user_info?.last_name && (
          <>
            <Typography.Text>
              Last Name : {user_info?.last_name}{" "}
            </Typography.Text>
            <br />
          </>
        )}
      </>
    );
  };

  if (enable_tooltip) {
    return (
      <Tooltip
        color={token.colorBgContainer}
        title={TooltipRender}
        onOpenChange={(open) => {
          if (open) {
            setOpened(true);
          } else {
            setOpened(false);
          }
        }}
      >
        <img
          src={avatar_query.data}
          alt="Avatar"
          width={size}
          height={size}
          className="cursor-pointer"
        />
      </Tooltip>
    );
  } else {
    return (
      <img src={avatar_query.data} alt="Avatar" width={size} height={size} />
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