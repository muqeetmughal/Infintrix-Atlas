import React, { useMemo, useState } from "react";
import { Avatar, Spin, theme, Tooltip, Typography } from "antd";
import PropTypes from "prop-types";
import { useAvatarQuery } from "../hooks/query";
import { useFrappeGetCall } from "frappe-react-sdk";

/* Tooltip Content Component */
const TooltipRender = ({ user }) => {
  if (!user) return "No data found";

  return (
    <>
      {user?.user_image && (
        <>
          <img
            src={user.user_image}
            alt="Avatar"
            width={100}
            height={100}
            className="rounded-full mb-2"
          />
          <br />
        </>
      )}

      <Typography.Title level={5} className="mb-0">
        {user?.full_name}
      </Typography.Title>

      <Typography.Text type="secondary">
        {user?.email}
      </Typography.Text>
    </>
  );
};

const AvatarGen = React.memo(({ name = null, size = 30, enable_tooltip = false }) => {
  const [opened, setOpened] = useState(false);

  const avatar_query = useAvatarQuery(name);
  const { token } = theme.useToken();

  const user_detail_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.user_details",
    { user: name }
  );

  /* Always run hooks before any return */
  const user_info = useMemo(() => {
    if (user_detail_query?.data) {
      return user_detail_query.data.message;
    }
    return null;
  }, [user_detail_query?.data]);

  const avatarSrc = user_info?.user_image || avatar_query?.data;

  const loading = avatar_query.isLoading && user_detail_query.isLoading;

  if (loading) {
    return <Spin size="small" />;
  }

  const avatarElement = (
    <Avatar
      size={size || "small"}
      src={avatarSrc}
      style={{ backgroundColor: "#87d068" }}
      className="cursor-pointer"
    />
  );

  if (!enable_tooltip) {
    return avatarElement;
  }

  return (
    <Tooltip
      color={token.colorBgContainer}
      title={<TooltipRender user={user_info} />}
      onOpenChange={(open) => setOpened(open)}
    >
      {avatarElement}
    </Tooltip>
  );
});

AvatarGen.propTypes = {
  name: PropTypes.string,
  size: PropTypes.number,
  enable_tooltip: PropTypes.bool,
};

export default AvatarGen;