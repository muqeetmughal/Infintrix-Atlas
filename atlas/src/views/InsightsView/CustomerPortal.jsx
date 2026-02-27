import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Progress,
  Badge,
  Timeline,
  Tabs,
  Button,
  Empty,
  Spin,
  Alert,
  Modal,
  Typography,
  ConfigProvider,
  Table,
  Avatar,
  Statistic,
  Divider,
  List as AntList,
  Input,
  Tag,
  Tooltip,
  notification,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ProjectOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  DownloadOutlined,
  MessageOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  SendOutlined,
  MailOutlined,
  CustomerServiceOutlined,
  LinkOutlined as LinkIcon,
} from "@ant-design/icons";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useQueryParams } from "../../hooks/useQueryParams";

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;



const ProjectSummaryCards = ({ summary }) => {
  const statusConfig = {
    "On Track": { color: "success", icon: <CheckCircleOutlined /> },
    "At Risk": { color: "warning", icon: <ExclamationCircleOutlined /> },
    Delayed: { color: "error", icon: <ClockCircleOutlined /> },
  };

  return (
    <Row gutter={[16, 16]} className="mb-8">
      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          className="h-full border-none shadow-sm hover:shadow-md transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest"
          >
            Project Health
          </Text>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge status={statusConfig[summary.overall_status]?.color || "default"} />
              <Title level={4} className="m-0!">
                {summary.overall_status}
              </Title>
            </div>
            <Tooltip title="Status is updated weekly based on task velocity.">
              <InfoCircleOutlined className="text-gray-300" />
            </Tooltip>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          className="h-full border-none shadow-sm hover:shadow-md transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest"
          >
            Progress
          </Text>
          <div className="mt-2">
            <div className="flex justify-between items-end mb-1">
              <Title level={4} className="m-0!">
                {summary.percent_complete}%
              </Title>
              <Text type="secondary" className="text-[10px]">
                6.2% vs last month
              </Text>
            </div>
            <Progress
              percent={summary.percent_complete}
              showInfo={false}
              strokeWidth={6}
              strokeColor="#1677ff"
            />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          className="h-full border-none shadow-sm hover:shadow-md transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest"
          >
            Next Milestone
          </Text>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
              {summary.days_to_milestone}d
            </div>
            <div>
              <Title level={5} className="m-0 truncate!">
                {summary.next_milestone_date}
              </Title>
              <Text
                type="secondary"
                className="text-[10px] uppercase font-bold"
              >
                Countdown
              </Text>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          className="h-full border-none shadow-sm hover:shadow-md transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest"
          >
            Active Phase
          </Text>
          <div className="mt-2">
            <Title level={5} className="m-0 truncate!">
              {summary.active_cycle?.title}
            </Title>
            <div className="flex items-center gap-2 mt-1">
              <CalendarOutlined className="text-[10px] text-gray-400" />
              <Text type="secondary" className="text-[10px]">
                {/* Due {summary.active_cycle?.end_date} */}
              </Text>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

const ApprovalWorkflow = ({ actions }) => {
  const [api, contextHolder] = notification.useNotification();

  const handleAction = (action) => {
    Modal.confirm({
      title: `Submit ${action.type}?`,
      content: `By clicking confirm, you are formally providing ${action.type.toLowerCase()} for "${action.title}". This will be logged in the project audit trail.`,
      okText: "Confirm Submission",
      cancelText: "Cancel",
      onOk: () => {
        api.success({
          message: "Submission Received",
          description: `The ${action.type} for ${action.id} has been recorded. Our team will review it shortly.`,
          placement: "topRight",
        });
      },
    });
  };

  if (actions.length === 0) return null;

  return (
    <>
      {contextHolder}
      <Card
        title={
          <span className="text-sm font-black uppercase tracking-widest text-orange-600">
            Action Required From You
          </span>
        }
        className="mb-8 border-t-4 border-t-orange-400 shadow-sm"
        extra={<Tag color="orange">{actions.length} Pending</Tag>}
      >
        <div className="space-y-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl gap-4 hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${action.priority === "High" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}
                >
                  <ExclamationCircleOutlined className="text-xl" />
                </div>
                <div>
                  <div className="font-black text-gray-800 text-base">
                    {action.title}
                  </div>
                  <div className="flex gap-4 mt-1">
                    <Text
                      type="secondary"
                      className="text-[10px] font-bold uppercase tracking-tight"
                    >
                      Type: {action.type}
                    </Text>
                    <Text
                      type="danger"
                      className="text-[10px] font-bold flex items-center gap-1"
                    >
                      <ClockCircleOutlined /> Due: {action.due_date}
                    </Text>
                  </div>
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                className="bg-gray-900 border-none hover:bg-indigo-600 rounded-xl font-bold px-8"
                onClick={() => handleAction(action)}
              >
                {action.type === "Approval"
                  ? "Sign & Approve"
                  : "Begin Submission"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

const InteractiveRoadmap = ({ cycles }) => {

  console.log("cycles", cycles)
  const [selectedId, setSelectedId] = useState(
    cycles.find((c) => c.status === "Active")?.id,
  );
  const activeCycle = useMemo(
    () => cycles.find((c) => c.id === selectedId),
    [selectedId, cycles],
  );

  return (
    <Card
      title={
        <span className="text-sm font-black uppercase tracking-widest">
          Project Lifecycle
        </span>
      }
      className="mb-8 shadow-sm"
    >
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
        {cycles.map((cycle) => (
          <div
            key={cycle.id}
            onClick={() => setSelectedId(cycle.id)}
            className={`flex-shrink-0 w-64 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedId === cycle.id
                ? "border-indigo-600 bg-indigo-50/50 shadow-md scale-105"
                : "border-gray-50 bg-white opacity-70 grayscale"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <Badge
                status={
                  cycle.status === "Completed"
                    ? "success"
                    : cycle.status === "Active"
                      ? "processing"
                      : "default"
                }
              />
              <Text className="text-[10px] font-black uppercase text-gray-400">
                {cycle.status}
              </Text>
            </div>
            <div className="font-black text-slate-800 text-sm mb-1">
              {cycle.title}
            </div>
            <Progress
              percent={cycle.completion}
              size="small"
              showInfo={false}
              strokeColor={cycle.status === "Completed" ? "#52c41a" : "#1677ff"}
            />
            <div className="text-[10px] text-gray-400 mt-3 font-bold">
              {/* {cycle.start_date} — {cycle?.end_date} */}
            </div>
          </div>
        ))}
      </div>

      {activeCycle && (
        <div className="mt-8 p-6 bg-slate-50 rounded-3xl animate-in fade-in duration-500">
          <Row gutter={24} align="middle">
            <Col xs={24} md={16}>
              <Text
                type="secondary"
                className="text-[10px] font-black uppercase tracking-widest"
              >
                Deliverables: {activeCycle.title}
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {(activeCycle?.deliverables || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100"
                  >
                    <CheckCircleOutlined className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Col>
            <Col
              xs={24}
              md={8}
              className="text-center md:text-right mt-6 md:mt-0"
            >
              <Button type="link" icon={<ArrowRightOutlined />}>
                Phase Archive
              </Button>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

const DocumentWorkbench = ({ requirements, resources }) => {
  const [search, setSearch] = useState("");

  const filteredRequirements = useMemo(
    () =>
      requirements.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [requirements, search],
  );

  return (
    <Card className="mb-8 shadow-sm">
      <Tabs
        defaultActiveKey="1"
        tabBarExtraContent={
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search documents..."
            className="w-48 hidden md:flex rounded-lg"
            onChange={(e) => setSearch(e.target.value)}
          />
        }
        items={[
          {
            key: "1",
            label: (
              <span className="text-[10px] font-black uppercase px-2">
                Knowledge Base
              </span>
            ),
            children: (
              <Table
                dataSource={resources}
                pagination={false}
                size="small"
                rowKey="id"
                columns={[
                  {
                    title: "Resource",
                    dataIndex: "title",
                    key: "title",
                    render: (text) => (
                      <Text strong className="text-sm">
                        {text}
                      </Text>
                    ),
                  },
                  {
                    title: "Type",
                    dataIndex: "type",
                    key: "type",
                    render: (t) => <Badge status="default" text={t} />,
                  },
                  {
                    title: "Added",
                    dataIndex: "date",
                    key: "date",
                    className: "hidden sm:table-cell",
                  },
                  {
                    title: "",
                    key: "action",
                    render: () => (
                      <Button type="text" icon={<DownloadOutlined />} />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: "2",
            label: (
              <span className="text-[10px] font-black uppercase px-2">
                Submissions
              </span>
            ),
            children: (
              <AntList
                dataSource={filteredRequirements}
                rowKey="id"
                renderItem={(req) => (
                  <AntList.Item
                    key={req.id}
                    className="px-0 hover:bg-gray-50 transition-colors p-4 rounded-xl"
                  >
                    <div className="flex justify-between w-full items-center">
                      <div className="flex items-center gap-4">
                        <FileTextOutlined className="text-indigo-400" />
                        <div>
                          <div className="font-bold text-sm">{req.title}</div>
                          <Text type="secondary" className="text-[10px]">
                            Owner: {req.owner} • {req.submitted_on}
                          </Text>
                        </div>
                      </div>
                      <Tag
                        color={
                          req.status === "Approved" ? "success" : "processing"
                        }
                      >
                        {req.status}
                      </Tag>
                    </div>
                  </AntList.Item>
                )}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};

const FinanceSnapshot = ({ financials }) => (
  <Card
    title={
      <span className="text-sm font-black uppercase tracking-widest">
        Commercial Summary
      </span>
    }
    className="mb-8 shadow-sm"
  >
    <Row gutter={16}>
      <Col xs={12} md={6}>
        <Statistic
          title="Project Budget"
          value={financials.total_budget}
          prefix={<DollarCircleOutlined />}
        />
      </Col>
      <Col xs={12} md={6}>
        <Statistic title="Invoiced" value={financials.total_invoiced} />
      </Col>
      <Col xs={12} md={6}>
        <Statistic
          title="Payment Status"
          value={Math.round(
            (financials.paid / financials.total_invoiced) * 100,
          )}
          suffix="%"
        />
      </Col>
      <Col xs={12} md={6}>
        <div className="flex flex-col h-full justify-center">
          <Button
            block
            type="primary"
            size="large"
            className="rounded-xl font-bold"
          >
            Billing Portal
          </Button>
        </div>
      </Col>
    </Row>
  </Card>
);

const TeamDirectory = ({ team }) => (
  <Card
    title={
      <span className="text-sm font-black uppercase tracking-widest">
        Assigned Experts
      </span>
    }
    className="mb-8 shadow-sm"
  >
    <div className="space-y-5">
      {team.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <Avatar
              size={48}
              style={{ backgroundColor: member.color }}
              shape="square"
              className="rounded-xl shadow-sm"
            >
              {member.avatar}
            </Avatar>
            <div>
              <div className="text-sm font-black text-gray-800">
                {member.name}
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                {member.role}
              </div>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip title={`Email ${member.name}`}>
              <Button shape="circle" icon={<MailOutlined />} size="small" />
            </Tooltip>
            <Tooltip title={`Chat with ${member.name}`}>
              <Button shape="circle" icon={<MessageOutlined />} size="small" />
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// --- Main Container ---

const CustomerPortal = () => {
  // const projectId = "PROJ-77291";
  const qp = useQueryParams();
  const projectId = qp.get("project");
  // const { data, loading, error } = useProjectDashboard(projectId);

  const query = useFrappeGetCall("infintrix_atlas.api.v1.get_customer_portal_data", {
    project: projectId,
  });
  const data = query?.data?.message || {}
  console.log("query", query?.data?.message)

  if (query.isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Securing data connection..." />
      </div>
    );
  if (query.error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert
          message="Connection Error"
          description={"query.error"}
          type="error"
          showIcon
        />
      </div>
    );

  return (
    <Layout className="min-h-screen ">
      {/* <Header className="bg-white border-b border-gray-100 flex items-center px-4 md:px-12 shadow-sm sticky top-0 z-50 justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ProjectOutlined className="text-white text-lg" />
            </div>
            <Title level={4} className="m-0! hidden sm:block tracking-tighter">Customer Workspace</Title>
          </div>
          <div className="flex items-center gap-4">
            <Button icon={<ClockCircleOutlined />} className="rounded-lg border-none bg-gray-50 font-bold hidden md:flex">History</Button>
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Customer" className="border-2 border-indigo-500" />
          </div>
        </Header> */}

      <Content className="p-4 md:p-12  mx-auto w-full">
     

        {/* 1. Summary Block */}
        <ProjectSummaryCards summary={data.summary} />

        {/* 2. Critical Action Center */}
        <ApprovalWorkflow actions={data.pendingActions} />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* 3. Interactive Roadmap */}
            <InteractiveRoadmap cycles={data?.cycles|| []} />

            {/* 4. Financial Status */}
            <FinanceSnapshot financials={data.financials} />

            {/* 5. Document Management */}
            <DocumentWorkbench
              requirements={data.requirements}
              resources={data.resources}
            />
          </Col>

          <Col xs={24} lg={8}>
            {/* 6. Team Engagement */}
            <TeamDirectory team={data.team} />

            {/* 7. Live Health Feed */}
            <Card
              title={
                <span className="text-xs font-black uppercase tracking-widest">
                  Engagement Score
                </span>
              }
              className="mb-8 shadow-sm"
            >
              <div className="flex flex-col items-center py-6">
                <Progress
                  type="dashboard"
                  percent={84}
                  strokeWidth={10}
                  strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                  size={160}
                />
                <div className="text-center mt-6">
                  <Title level={5} className="m-0!">
                    Highly Efficient
                  </Title>
                  <Paragraph className="text-[10px] text-gray-400 uppercase font-black mt-1">
                    Approval Latency: 4.2h Avg
                  </Paragraph>
                </div>
              </div>
            </Card>

            {/* 8. Call to Action */}
            <Card className="bg-slate-900 border-none rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <Title level={3} className="text-white! mb-2! tracking-tight">
                  Need Support?
                </Title>
                <Paragraph className="text-slate-400 text-xs mb-8">
                  Open a high-priority ticket or request a scope adjustment call
                  with your manager.
                </Paragraph>
                <Button
                  block
                  size="large"
                  className="h-14 bg-indigo-600 border-none text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-500/20"
                >
                  <SendOutlined /> Request Consultation
                </Button>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <CustomerServiceOutlined
                  style={{ fontSize: "180px", color: "#fff" }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default CustomerPortal;
