import { useState, useMemo } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Progress,
  Badge,
  Tabs,
  Button,
  Spin,
  Alert,
  Modal,
  Typography,
  Table,
  Avatar,
  Statistic,
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
  CalendarOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  MessageOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  SendOutlined,
  MailOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useQueryParams } from "../../hooks/useQueryParams";

const { Content } = Layout;
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
          className="h-full border-none shadow-sm hover:shadow-md dark:bg-slate-800 dark:border-slate-700 transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest dark:text-gray-400"
          >
            Project Health
          </Text>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                status={
                  statusConfig[summary?.overall_status]?.color || "default"
                }
              />
              <Title level={4} className="m-0! dark:text-gray-100">
                {summary?.overall_status}
              </Title>
            </div>
            <Tooltip title="Status is updated weekly based on task velocity.">
              <InfoCircleOutlined className="text-gray-300 dark:text-gray-600" />
            </Tooltip>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          className="h-full border-none shadow-sm hover:shadow-md dark:bg-slate-800 dark:border-slate-700 transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest dark:text-gray-400"
          >
            Progress
          </Text>
          <div className="mt-2">
            <div className="flex justify-between items-end mb-1">
              <Title level={4} className="m-0! dark:text-gray-100">
                {summary?.percent_complete}%
              </Title>
              <Text type="secondary" className="text-[10px] dark:text-gray-500">
                6.2% vs last month
              </Text>
            </div>
            <Progress
              percent={summary?.percent_complete}
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
          className="h-full border-none shadow-sm hover:shadow-md dark:bg-slate-800 dark:border-slate-700 transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest dark:text-gray-400"
          >
            Next Milestone
          </Text>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
              {summary?.days_to_milestone}d
            </div>
            <div>
              <Title level={5} className="m-0 truncate! dark:text-gray-100">
                {summary?.next_milestone_date}
              </Title>
              <Text
                type="secondary"
                className="text-[10px] uppercase font-bold dark:text-gray-500"
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
          className="h-full border-none shadow-sm hover:shadow-md dark:bg-slate-800 dark:border-slate-700 transition-shadow"
        >
          <Text
            type="secondary"
            className="uppercase text-[10px] font-bold tracking-widest dark:text-gray-400"
          >
            Active Phase
          </Text>
          <div className="mt-2">
            <Title level={5} className="m-0 truncate! dark:text-gray-100">
              {summary?.active_cycle?.title}
            </Title>
            <div className="flex items-center gap-2 mt-1">
              <CalendarOutlined className="text-[10px] text-gray-400 dark:text-gray-600" />
              <Text type="secondary" className="text-[10px] dark:text-gray-500">
                Active
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
          description: `The ${action.type} for ${action.id} has been recorded.`,
          placement: "topRight",
        });
      },
    });
  };

  if (!actions || actions.length === 0) return null;

  return (
    <>
      {contextHolder}
      <Card
        title={
          <span className="text-sm font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
            Action Required From You
          </span>
        }
        className="mb-8 border-t-4 border-t-orange-400 shadow-sm dark:bg-slate-800 dark:border-orange-500"
        extra={<Tag color="orange">{actions.length} Pending</Tag>}
      >
        <div className="space-y-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl gap-4 hover:shadow-sm dark:hover:shadow-slate-900/50 transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    action.priority === "High"
                      ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  <ExclamationCircleOutlined className="text-xl" />
                </div>
                <div>
                  <div className="font-black text-gray-800 dark:text-gray-100 text-base">
                    {action.title}
                  </div>
                  <div className="flex gap-4 mt-1">
                    <Text
                      type="secondary"
                      className="text-[10px] font-bold uppercase tracking-tight dark:text-gray-400"
                    >
                      Type: {action.type}
                    </Text>
                    <Text
                      type="danger"
                      className="text-[10px] font-bold flex items-center gap-1 dark:text-red-400"
                    >
                      <ClockCircleOutlined /> Due: {action.due_date}
                    </Text>
                  </div>
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                className="shrink-0 bg-gray-900 dark:bg-indigo-600 border-none hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl font-bold px-8"
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
  const [selectedId, setSelectedId] = useState(
    cycles?.find((c) => c.status === "Active")?.id,
  );
  const activeCycle = useMemo(
    () => cycles?.find((c) => c.id === selectedId),
    [selectedId, cycles],
  );

  return (
    <Card
      title={
        <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
          Project Lifecycle
        </span>
      }
      className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
    >
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
        {cycles?.map((cycle) => (
          <div
            key={cycle.id}
            onClick={() => setSelectedId(cycle.id)}
            className={`shrink-0 w-64 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedId === cycle.id
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md scale-105"
                : "border-gray-50 dark:border-slate-700 bg-white dark:bg-slate-700 opacity-70 grayscale"
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
              <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-600">
                {cycle.status}
              </Text>
            </div>
            <div className="font-black text-slate-800 dark:text-gray-100 text-sm mb-1">
              {cycle.title}
            </div>
            <Progress
              percent={cycle.completion}
              size="small"
              showInfo={false}
              strokeColor={cycle.status === "Completed" ? "#52c41a" : "#1677ff"}
            />
          </div>
        ))}
      </div>

      {activeCycle && (
        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-700 rounded-3xl animate-in fade-in duration-500">
          <Row gutter={24} align="middle">
            <Col xs={24} md={16}>
              <Text
                type="secondary"
                className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400"
              >
                Deliverables: {activeCycle.title}
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {(activeCycle?.deliverables || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white dark:bg-slate-600 p-3 rounded-xl border border-gray-100 dark:border-slate-500"
                  >
                    <CheckCircleOutlined className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-gray-200">
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
              <Button
                type="link"
                icon={<ArrowRightOutlined />}
                className="dark:text-indigo-400"
              >
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
      requirements?.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()),
      ) || [],
    [requirements, search],
  );

  return (
    <Card className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <Tabs
        defaultActiveKey="1"
        tabBarExtraContent={
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search documents..."
            className="w-48 hidden md:flex rounded-lg dark:bg-slate-700 dark:text-gray-100 dark:border-slate-600"
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
                className="dark:bg-slate-800"
                columns={[
                  {
                    title: "Resource",
                    dataIndex: "title",
                    key: "title",
                    render: (text) => (
                      <Text strong className="text-sm dark:text-gray-100">
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
                    className="px-0 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors p-4 rounded-xl"
                  >
                    <div className="flex justify-between w-full items-center">
                      <div className="flex items-center gap-4">
                        <FileTextOutlined className="text-indigo-400" />
                        <div>
                          <div className="font-bold text-sm dark:text-gray-100">
                            {req.title}
                          </div>
                          <Text
                            type="secondary"
                            className="text-[10px] dark:text-gray-400"
                          >
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
      <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
        Commercial Summary
      </span>
    }
    className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
  >
    <Row gutter={16}>
      <Col xs={12} md={6}>
        <Statistic
          title="Project Budget"
          value={financials?.total_budget}
          prefix={<DollarCircleOutlined />}
          valueStyle={{ color: "#1677ff" }}
        />
      </Col>
      <Col xs={12} md={6}>
        <Statistic
          title="Invoiced"
          value={financials?.total_invoiced}
          valueStyle={{ color: "#1677ff" }}
        />
      </Col>
      <Col xs={12} md={6}>
        <Statistic
          title="Payment Status"
          value={Math.round(
            ((financials?.paid || 0) / (financials?.total_invoiced || 1)) * 100,
          )}
          suffix="%"
          valueStyle={{ color: "#52c41a" }}
        />
      </Col>
      <Col xs={12} md={6}>
        <div className="flex flex-col h-full justify-center">
          <Button
            block
            type="primary"
            size="large"
            className="rounded-xl font-bold dark:bg-indigo-600"
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
      <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
        Assigned Experts
      </span>
    }
    className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
  >
    <div className="space-y-5">
      {team?.map((member) => (
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
              <div className="text-sm font-black text-gray-800 dark:text-gray-100">
                {member.name}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">
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

const CustomerPortal = () => {
  const qp = useQueryParams();
  const projectId = qp.get("project");

  const query = useFrappeGetCall(
    "infintrix_atlas.api.v1.get_customer_portal_data",
    { project: projectId },
  );
  const data = query?.data?.message || {};

  if (query.isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Spin size="large" tip="Securing data connection..." />
      </div>
    );

  if (query.error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Alert
          message="Connection Error"
          description="Failed to load portal data"
          type="error"
          showIcon
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Content className="p-4 md:p-12 mx-auto w-full">
        <ProjectSummaryCards summary={data.summary} />
        <ApprovalWorkflow actions={data.pendingActions} />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <InteractiveRoadmap cycles={data?.cycles || []} />
            <FinanceSnapshot financials={data.financials} />
            <DocumentWorkbench
              requirements={data.requirements}
              resources={data.resources}
            />
          </Col>

          <Col xs={24} lg={8}>
            <TeamDirectory team={data.team} />

            <Card
              title={
                <span className="text-xs font-black uppercase tracking-widest dark:text-gray-100">
                  Engagement Score
                </span>
              }
              className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
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
                  <Title level={5} className="m-0! dark:text-gray-100">
                    Highly Efficient
                  </Title>
                  <Paragraph className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black mt-1">
                    Approval Latency: 4.2h Avg
                  </Paragraph>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 dark:bg-slate-950 border-none rounded-4xl p-8 shadow-2xl relative overflow-hidden group">
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
                  className="h-14 bg-indigo-600 border-none text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 dark:hover:bg-indigo-500"
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
    </div>
  );
};

export default CustomerPortal;
