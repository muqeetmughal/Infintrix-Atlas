import dayjs from "dayjs";
import {Tooltip } from "antd";
const RelativeTime = ({ date }) => {
  if (!date) return null;
  return (
    <Tooltip title={dayjs(date).format("MMMM D, YYYY, h:mm A")}>
      {dayjs(date).fromNow()}
    </Tooltip>
  );
};

export default RelativeTime;
