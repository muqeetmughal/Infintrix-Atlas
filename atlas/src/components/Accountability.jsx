import { Card, Table, Tag, Typography } from "antd";
import { useFrappeGetCall } from "frappe-react-sdk";

const { Text } = Typography;

const getSeverityTag = (value, type = "neutral") => {
  if (value === 0) {
    return <Text type="secondary">0</Text>;
  }

  if (type === "danger") {
    return <Tag color="red">{value}</Tag>;
  }

  if (type === "warning") {
    return <Tag color="orange">{value}</Tag>;
  }

  if (type === "success") {
    return <Tag color="green">{value}</Tag>;
  }

  return <Tag color="blue">{value}</Tag>;
};

const Accountability = () => {
  const tasks_accountability_report_query = useFrappeGetCall(
    "infintrix_atlas.api.v1.tasks_accountability_report",
  );
  const data = Array.isArray(tasks_accountability_report_query.data?.message) ? tasks_accountability_report_query.data.message : [];
  const columns = [
    {
      title: "ASSIGNEE",
      dataIndex: "full_name",
      key: "full_name",
      fixed: "left",
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.assignee}
          </Text>
        </div>
      ),
    },
    {
      title: "OPEN",
      dataIndex: "open_count",
      align: "right",
      render: (v) => getSeverityTag(v, "warning"),
    },
    {
      title: "OVERDUE",
      dataIndex: "overdue_count",
      align: "right",
      render: (v) => getSeverityTag(v, "danger"),
    },
    {
      title: "AGING > 3D",
      dataIndex: "aging_3d_count",
      align: "right",
      render: (v) => getSeverityTag(v, "danger"),
    },
    {
      title: "PENDING REVIEW",
      dataIndex: "pending_review_count",
      align: "right",
      render: (v) => getSeverityTag(v, "warning"),
    },
    {
      title: "AVG DELAY (DAYS)",
      dataIndex: "avg_delay",
      align: "right",
      render: (v) =>
        v === 0 ? (
          <Text type="secondary">0</Text>
        ) : (
          <Text type={v > 3 ? "danger" : "warning"}>{v.toFixed(1)}</Text>
        ),
    },
    {
      title: "COMPLETED",
      dataIndex: "completed_count",
      align: "right",
      render: (v) => getSeverityTag(v, "success"),
    },
  ];



  return (
    <Card>

        <Table
        bordered={false}
          columns={columns}
          dataSource={data}
          size="middle"
          
          pagination={false}
          rowClassName={(record) => (record.overdue_count > 0 ? "row-danger" : "")}
        />
    </Card>
  );
};

export default Accountability;

// import { Table } from "antd";
// import { useFrappeGetCall } from "frappe-react-sdk";
// import React from "react";

// const Accountability = () => {
// //   const tasks_accountability_report_query = useFrappeGetCall(
// //     "infintrix_atlas.api.v1.tasks_accountability_report",
// //   );

//   const columns = [
//     "assignee",
//     "full_name",
//     "open_count",
//     "overdue_count",
//     "aging_3d_count",
//     "pending_review_count",
//     "avg_delay",
//     "completed_count",
//   ].map((key) => ({
//     title: key.replace(/_/g, " ").toUpperCase(),
//     dataIndex: key,
//     key,
//   }));

//   const fakeData = [
//     {
//         "assignee": "Administrator",
//         "full_name": "Administrator",
//         "open_count": 63,
//         "overdue_count": 63,
//         "aging_3d_count": 80,
//         "pending_review_count": 0,
//         "avg_delay": 11.69,
//         "completed_count": 12,
//         "key": 0
//     },
//     {
//         "assignee": "Unassigned",
//         "full_name": "Unassigned",
//         "open_count": 11,
//         "overdue_count": 11,
//         "aging_3d_count": 14,
//         "pending_review_count": 0,
//         "avg_delay": 12.5,
//         "completed_count": 3,
//         "key": 1
//     },
//     {
//         "assignee": "user2@gmail.com",
//         "full_name": "User 2",
//         "open_count": 9,
//         "overdue_count": 9,
//         "aging_3d_count": 15,
//         "pending_review_count": 0,
//         "avg_delay": 12.4,
//         "completed_count": 3,
//         "key": 2
//     },
//     {
//         "assignee": "kashi@gmail.com",
//         "full_name": "Kashif",
//         "open_count": 0,
//         "overdue_count": 0,
//         "aging_3d_count": 5,
//         "pending_review_count": 1,
//         "avg_delay": 7.5,
//         "completed_count": 4,
//         "key": 3
//     },
//     {
//         "assignee": "muqeetmughal786@gmail.com",
//         "full_name": "Muqeet",
//         "open_count": 0,
//         "overdue_count": 0,
//         "aging_3d_count": 6,
//         "pending_review_count": 0,
//         "avg_delay": 8.83,
//         "completed_count": 5,
//         "key": 4
//     }
// ]

//   const data = (fakeData||[]).map((item, index) => {
//     if (item.assignee == null) {
//        return ({ ...item, key: index, assignee : "Unassigned", full_name: "Unassigned" })
//     }
//     return ({ ...item, key: index })
//   });

//     return <Table dataSource={data} columns={columns}/>
// };

// export default Accountability;
