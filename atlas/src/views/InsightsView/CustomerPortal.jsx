import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  List as AntList,
  Modal,
  message,
  notification,
  Progress,
  Row,
  Select,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useQueryParams } from "../../hooks/useQueryParams";
import { formatCurrency, getDefaultCurrency } from "../../lib/currency";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ProjectSummaryCards = ({ summary }) => {
  const statusConfig = {
    "On Track": { color: "success" },
    "At Risk": { color: "warning" },
    Delayed: { color: "error" },
    Completed: { color: "success" },
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
                {summary?.overall_status || "Unknown"}
              </Title>
            </div>
            <Tooltip title="Calculated from project status, overdue work, and target dates.">
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
                {summary?.percent_complete || 0}%
              </Title>
              <Text type="secondary" className="text-[10px] dark:text-gray-500">
                Overall completion
              </Text>
            </div>
            <Progress
              percent={summary?.percent_complete || 0}
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
            Next Deadline
          </Text>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
              {summary?.days_to_milestone ?? "-"}d
            </div>
            <div>
              <Title level={5} className="m-0 truncate! dark:text-gray-100">
                {summary?.next_milestone_date || "Not scheduled"}
              </Title>
              <Text
                type="secondary"
                className="text-[10px] uppercase font-bold dark:text-gray-500"
              >
                Phase target
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
              {summary?.active_phase?.title || "Not started"}
            </Title>
            <div className="flex items-center gap-2 mt-1">
              <CalendarOutlined className="text-[10px] text-gray-400 dark:text-gray-600" />
              <Text type="secondary" className="text-[10px] dark:text-gray-500">
                {summary?.active_phase?.status || "Planned"}
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

  if (!actions?.length) {
    return null;
  }

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
                  <div className="flex flex-wrap gap-4 mt-1">
                    <Text
                      type="secondary"
                      className="text-[10px] font-bold uppercase tracking-tight dark:text-gray-400"
                    >
                      Type: {action.type}
                    </Text>
                    {action.phase && (
                      <Text
                        type="secondary"
                        className="text-[10px] font-bold uppercase tracking-tight dark:text-gray-400"
                      >
                        Phase: {action.phase}
                      </Text>
                    )}
                    <Text
                      type="danger"
                      className="text-[10px] font-bold flex items-center gap-1 dark:text-red-400"
                    >
                      <ClockCircleOutlined /> Due: {action.due_date || "Not set"}
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
                {action.type === "Approval" ? "Sign & Approve" : "Begin Submission"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

const InteractiveRoadmap = ({ phases }) => {
  const [selectedId, setSelectedId] = useState(
    phases?.find((phase) => phase.status === "Active")?.id || phases?.[0]?.id,
  );

  const activePhase = useMemo(
    () => phases?.find((phase) => phase.id === selectedId),
    [phases, selectedId],
  );

  return (
    <Card
      title={
        <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
          Project Phases
        </span>
      }
      className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
    >
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
        {phases?.map((phase) => (
          <div
            key={phase.id}
            onClick={() => setSelectedId(phase.id)}
            className={`shrink-0 w-64 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedId === phase.id
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md scale-105"
                : "border-gray-50 dark:border-slate-700 bg-white dark:bg-slate-700 opacity-70 grayscale"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <Badge
                status={
                  phase.status === "Completed"
                    ? "success"
                    : phase.status === "Active"
                      ? "processing"
                      : "default"
                }
              />
              <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-600">
                {phase.status}
              </Text>
            </div>
            <div className="font-black text-slate-800 dark:text-gray-100 text-sm mb-1">
              {phase.title}
            </div>
            <Progress
              percent={phase.completion || 0}
              size="small"
              showInfo={false}
              strokeColor={phase.status === "Completed" ? "#52c41a" : "#1677ff"}
            />
          </div>
        ))}
      </div>

      {activePhase && (
        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-700 rounded-3xl animate-in fade-in duration-500">
          <Row gutter={24} align="middle">
            <Col xs={24} md={16}>
              <Text
                type="secondary"
                className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400"
              >
                Deliverables: {activePhase.title}
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {(activePhase.deliverables || []).length > 0 ? (
                  (activePhase.deliverables || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white dark:bg-slate-600 p-3 rounded-xl border border-gray-100 dark:border-slate-500"
                    >
                      <CheckCircleOutlined className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-gray-200">
                        {item}
                      </span>
                    </div>
                  ))
                ) : (
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    No deliverables linked yet for this phase.
                  </Text>
                )}
              </div>
            </Col>
            <Col xs={24} md={8} className="text-center md:text-right mt-6 md:mt-0">
              <div className="space-y-2">
                <Text className="block text-[11px] uppercase font-black text-gray-400 dark:text-gray-500">
                  {activePhase.completed_tasks || 0} of {activePhase.tasks_count || 0} tasks completed
                </Text>
                <Text className="block text-xs text-gray-500 dark:text-gray-400">
                  Target: {activePhase.end_date || "Not set"}
                </Text>
              </div>
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
      requirements?.filter((requirement) =>
        (requirement.title || "").toLowerCase().includes(search.toLowerCase()),
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
                    render: (type) => <Badge status="default" text={type} />,
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
                    render: (_, row) => (
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        disabled={!row.url}
                        onClick={() => row.url && window.open(row.url, "_blank")}
                      />
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
                renderItem={(requirement) => (
                  <AntList.Item
                    key={requirement.id}
                    className="px-0 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors p-4 rounded-xl"
                  >
                    <div className="flex justify-between w-full items-center gap-3">
                      <div className="flex items-center gap-4">
                        <FileTextOutlined className="text-indigo-400" />
                        <div>
                          <div className="font-bold text-sm dark:text-gray-100">
                            {requirement.title}
                          </div>
                          <Text
                            type="secondary"
                            className="text-[10px] dark:text-gray-400"
                          >
                            Owner: {requirement.owner} • {requirement.submitted_on}
                          </Text>
                        </div>
                      </div>
                      <Tag
                        color={
                          requirement.status === "Approved" ||
                          requirement.status === "Implemented"
                            ? "success"
                            : "processing"
                        }
                      >
                        {requirement.status}
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

const FinanceSnapshot = ({ financials }) => {
  const currency = financials?.currency || getDefaultCurrency();

  return (
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
            value={formatCurrency(financials?.total_budget || 0, { currency })}
            valueStyle={{ color: "#1677ff", fontSize: 20 }}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Invoiced"
            value={formatCurrency(financials?.total_invoiced || 0, { currency })}
            valueStyle={{ color: "#1677ff", fontSize: 20 }}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Collected"
            value={formatCurrency(financials?.paid || 0, { currency })}
            valueStyle={{ color: "#52c41a", fontSize: 20 }}
          />
        </Col>
        <Col xs={12} md={6}>
          <div className="flex flex-col h-full justify-center">
            <Text className="text-xs uppercase font-black text-gray-400 dark:text-gray-500">
              Last Invoice
            </Text>
            <Title level={5} className="m-0! dark:text-gray-100">
              {financials?.last_invoice_date || "No invoices"}
            </Title>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

const PortalMetrics = ({ progress, portalMetrics }) => {
  const total = progress?.total || 0;
  const completion = total
    ? Math.round(((progress?.completed || 0) / total) * 100)
    : 0;

  return (
    <Card
      title={
        <span className="text-xs font-black uppercase tracking-widest dark:text-gray-100">
          Delivery Snapshot
        </span>
      }
      className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
    >
      <div className="flex flex-col items-center py-6">
        <Progress
          type="dashboard"
          percent={completion}
          strokeWidth={10}
          strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
          size={160}
        />
        <div className="text-center mt-6">
          <Title level={5} className="m-0! dark:text-gray-100">
            {progress?.completed || 0} completed tasks
          </Title>
          <Paragraph className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black mt-1">
            {progress?.in_progress || 0} in progress • {portalMetrics?.pending_actions || 0} pending client actions
          </Paragraph>
        </div>
      </div>
    </Card>
  );
};

const RequirementSubmissionPanel = ({
  projectId,
  requirements,
  onSubmitted,
}) => {
  const [form] = Form.useForm();
  const requirementMutation = useFrappePostCall(
    "infintrix_atlas.api.v1.submit_portal_requirement",
  );

  return (
    <Card
      title={
        <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
          Submit Requirement
        </span>
      }
      className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          requirementMutation
            .call({
              project: projectId,
              title: values.title,
              description: values.description,
              acceptance_criteria: values.acceptance_criteria,
              priority: values.priority,
              source: "Meeting",
            })
            .then(() => {
              message.success("Requirement submitted");
              form.resetFields();
              onSubmitted?.();
            });
        }}
      >
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="What do you need delivered?" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={3}
            placeholder="Describe the business need or request"
          />
        </Form.Item>
        <Form.Item name="acceptance_criteria" label="Acceptance Criteria">
          <Input.TextArea
            rows={3}
            placeholder="What would make this requirement complete?"
          />
        </Form.Item>
        <Form.Item
          name="priority"
          label="Priority"
          initialValue="Medium"
        >
          <Select
            options={[
              { label: "Low", value: "Low" },
              { label: "Medium", value: "Medium" },
              { label: "High", value: "High" },
            ]}
          />
        </Form.Item>
        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={requirementMutation.loading}
          >
            Submit Requirement
          </Button>
        </div>
      </Form>

      <div className="mt-6">
        <Text className="text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500">
          Recent Requirements
        </Text>
        <AntList
          className="mt-3"
          dataSource={requirements || []}
          rowKey="name"
          renderItem={(item) => (
            <AntList.Item>
              <div className="flex justify-between items-center w-full gap-3">
                <div>
                  <div className="font-semibold dark:text-gray-100">{item.title}</div>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {item.task_count || 0} linked tasks
                  </Text>
                </div>
                <Tag color={item.status === "Approved" ? "success" : "processing"}>
                  {item.status}
                </Tag>
              </div>
            </AntList.Item>
          )}
        />
      </div>
    </Card>
  );
};

const ChangeRequestPanel = ({
  projectId,
  changeRequests,
  requirements,
  onSubmitted,
}) => {
  const [form] = Form.useForm();
  const changeRequestMutation = useFrappePostCall(
    "infintrix_atlas.api.v1.submit_change_request",
  );

  return (
    <Card
      title={
        <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
          Change Requests
        </span>
      }
      className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          changeRequestMutation
            .call({
              project: projectId,
              title: values.title,
              description: values.description,
              related_requirement: values.related_requirement,
              impact_hours: values.impact_hours || 0,
              impact_cost: values.impact_cost || 0,
              impact_days: values.impact_days || 0,
            })
            .then(() => {
              message.success("Change request submitted");
              form.resetFields();
              onSubmitted?.();
            });
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input placeholder="Requested scope change" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="related_requirement" label="Related Requirement">
              <Select
                allowClear
                placeholder="Select existing requirement"
                options={(requirements || []).map((item) => ({
                  label: item.title,
                  value: item.name,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={3} placeholder="Describe the requested change" />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="impact_hours" label="Impact Hours">
              <Input type="number" min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="impact_cost" label="Impact Cost">
              <Input type="number" min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="impact_days" label="Impact Days">
              <Input type="number" min={0} />
            </Form.Item>
          </Col>
        </Row>
        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={changeRequestMutation.loading}
          >
            Submit Change Request
          </Button>
        </div>
      </Form>

      <AntList
        className="mt-6"
        dataSource={changeRequests || []}
        rowKey="name"
        renderItem={(item) => (
          <AntList.Item>
            <div className="flex justify-between items-start gap-3 w-full">
              <div>
                <div className="font-semibold dark:text-gray-100">{item.title}</div>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {item.related_requirement_title || "Standalone request"} •{" "}
                  {item.request_date || "No date"}
                </Text>
              </div>
              <Tag
                color={
                  item.status === "Approved"
                    ? "success"
                    : item.status === "Rejected"
                      ? "error"
                      : "processing"
                }
              >
                {item.status}
              </Tag>
            </div>
          </AntList.Item>
        )}
      />
    </Card>
  );
};

const ActionRequestPanel = ({
  actionRequests,
  onSubmitted,
}) => {
  const completeMutation = useFrappePostCall(
    "infintrix_atlas.api.v1.complete_action_request",
  );
  const rejectMutation = useFrappePostCall(
    "infintrix_atlas.api.v1.reject_action_request",
  );

  return (
    <Card
      title={
        <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
          Action Requests
        </span>
      }
      className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
    >
      <AntList
        dataSource={actionRequests || []}
        rowKey="name"
        renderItem={(item) => (
          <AntList.Item>
            <div className="flex justify-between items-start gap-3 w-full">
              <div>
                <div className="font-semibold dark:text-gray-100">{item.title}</div>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {item.action_type} • {item.phase_title || "No phase"} {item.due_date ? `• Due: ${item.due_date}` : ""}
                </Text>
                {item.description && (
                  <Text className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.description}
                  </Text>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Tag
                  color={
                    item.status === "Completed"
                      ? "success"
                      : item.status === "Expired"
                        ? "default"
                        : item.status === "Rejected"
                          ? "error"
                          : "warning"
                  }
                >
                  {item.status}
                </Tag>
                {item.status === "Pending" && (
                  <div className="flex gap-1">
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={completeMutation.loading}
                      onClick={() => {
                        completeMutation.call({ action_request: item.name }).then(() => {
                          message.success("Action request completed");
                          onSubmitted?.();
                        });
                      }}
                    >
                      Complete
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={rejectMutation.loading}
                      onClick={() => {
                        rejectMutation.call({ action_request: item.name }).then(() => {
                          message.success("Action request rejected");
                          onSubmitted?.();
                        });
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </AntList.Item>
        )}
      />
    </Card>
  );
};

const ScopeSnapshotsPanel = ({ snapshots }) => (
  <Card
    title={
      <span className="text-sm font-black uppercase tracking-widest dark:text-gray-100">
        Scope Baselines
      </span>
    }
    className="mb-8 shadow-sm dark:bg-slate-800 dark:border-slate-700"
  >
    <AntList
      dataSource={snapshots || []}
      rowKey="name"
      renderItem={(item) => (
        <AntList.Item>
          <div className="flex justify-between items-center w-full gap-3">
            <div>
              <div className="font-semibold dark:text-gray-100">
                Version {item.version}
              </div>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {item.snapshot_date} • {item.requirements_count || 0} requirements
              </Text>
            </div>
            <Tag color={item.docstatus === 1 ? "success" : "default"}>
              {item.docstatus === 1 ? "Submitted" : "Draft"}
            </Tag>
          </div>
        </AntList.Item>
      )}
    />
  </Card>
);

const CustomerPortal = () => {
  const qp = useQueryParams();
  const projectId = qp.get("project");

  const query = useFrappeGetCall(
    "infintrix_atlas.api.v1.get_customer_portal_data",
    { project: projectId },
    projectId ? ["customer_portal_data", projectId] : null,
  );
  const requirementsQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_requirements",
    { project: projectId },
    projectId ? ["project_requirements", projectId] : null,
  );
  const changeRequestsQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_change_requests",
    { project: projectId },
    projectId ? ["project_change_requests", projectId] : null,
  );
  const actionRequestsQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_action_requests",
    { project: projectId, include_completed: true },
    projectId ? ["customer_action_requests", projectId] : null,
  );
  const snapshotsQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_scope_snapshots",
    { project: projectId },
    projectId ? ["project_scope_snapshots", projectId] : null,
  );

  const data = query?.data?.message || {};
  const requirements = requirementsQuery?.data?.message || [];
  const changeRequests = changeRequestsQuery?.data?.message || [];
  const actionRequests = actionRequestsQuery?.data?.message || [];
  const snapshots = snapshotsQuery?.data?.message || [];

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Alert
          message="Project not selected"
          description="Open insights from a specific project to view customer-facing updates."
          type="info"
          showIcon
        />
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Spin size="large" tip="Securing data connection..." />
      </div>
    );
  }

  if (query.error) {
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
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Content className="p-4 md:p-12 mx-auto w-full">
        <ProjectSummaryCards summary={data.summary} />
        <ApprovalWorkflow actions={data.pendingActions} />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <InteractiveRoadmap phases={data.phases || []} />
            <FinanceSnapshot financials={data.financials} />
            <RequirementSubmissionPanel
              projectId={projectId}
              requirements={requirements}
              onSubmitted={() => {
                requirementsQuery.mutate();
                query.mutate();
              }}
            />
            <ChangeRequestPanel
              projectId={projectId}
              changeRequests={changeRequests}
              requirements={requirements}
              onSubmitted={() => {
                changeRequestsQuery.mutate();
              }}
            />
            <ActionRequestPanel
              projectId={projectId}
              actionRequests={actionRequests}
              onSubmitted={() => {
                actionRequestsQuery.mutate();
                query.mutate();
              }}
            />
            <ScopeSnapshotsPanel snapshots={snapshots} />
            <DocumentWorkbench
              requirements={data.requirements || []}
              resources={data.resources || []}
            />
          </Col>

          <Col xs={24} lg={8}>
            <PortalMetrics
              progress={data.progress}
              portalMetrics={data.portal_metrics}
            />

            <Card className="bg-slate-900 dark:bg-slate-950 border-none rounded-4xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <Title level={3} className="text-white! mb-2! tracking-tight">
                  Need Support?
                </Title>
                <Paragraph className="text-slate-400 text-xs mb-8">
                  Open a high-priority ticket or request a scope adjustment call
                  with your delivery team.
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
