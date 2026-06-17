import React, { useState } from "react";
import {
  ChevronRight,
  TrendingUp,
  Layers,
  Users,
  UserPlus,
  BarChart3,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Activity,
  Info,
  Building2,
  FileText,
  GitPullRequest,
  Camera,
  BookOpen,
  ListChecks,
} from "lucide-react";
import { useFrappeGetDoc, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useQueryParams } from "../hooks/useQueryParams";
import { formatCurrency as formatCurrencyValue } from "../lib/currency";
import { useHasRole } from "../hooks/useRole";
import { Button, Tag, Table, Modal, Form, Input, Select, message, Row, Col } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";

const ROLES = { PM: "Projects Manager", STAFF: "Staff", CLIENT: "Client" };

const Badge = ({ children, variant = "neutral" }) => {
  const themes = {
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
    danger: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800",
    info: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
    locked: "bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${themes[variant]}`}>
      {children}
    </span>
  );
};

const formatPercent = (value) => `${Number(value || 0).toLocaleString()}%`;

const OverviewTab = ({ project }) => {
  const { has: canViewFinancials, isLoading: isRoleLoading } = useHasRole(ROLES.PM);
  const currency = project.currency || project.default_currency;
  const totalActualCost =
    Number(project.total_costing_amount || 0) +
    Number(project.total_purchase_cost || 0) +
    Number(project.total_consumed_material_cost || 0) +
    Number(project.total_expense_claim || 0);

  const financialMetrics = [
    { label: "Estimated Cost", value: formatCurrencyValue(project.estimated_costing, { currency }), icon: DollarSign, color: "text-emerald-500" },
    { label: "Total Actual Cost", value: formatCurrencyValue(totalActualCost, { currency }), icon: Activity, color: "text-amber-500" },
    { label: "Total Actual Amount Billed", value: formatCurrencyValue(project.total_billed_amount, { currency }), icon: BarChart3, color: "text-indigo-500" },
    { label: "Gross Margin", value: formatPercent(project.per_gross_margin), icon: TrendingUp, color: Number(project.per_gross_margin || 0) >= 0 ? "text-slate-400 dark:text-slate-500" : "text-rose-500 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-8">
      <div className={`${canViewFinancials && !isRoleLoading ? "lg:col-span-2" : "lg:col-span-3"} space-y-8`}>
        {canViewFinancials && !isRoleLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {financialMetrics.map((m, i) => (
              <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 rounded-[32px] hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all">
                <div className={`w-10 h-10 bg-slate-50 dark:bg-slate-800 ${m.color} rounded-xl flex items-center justify-center mb-4`}>
                  <m.icon size={20} />
                </div>
                <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.label}</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{m.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[40px] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Info size={14} /> Project Metadata
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            {[
              { label: "Created On", value: project.creation },
              { label: "Completion Method", value: project.percent_complete_method },
              { label: "Is Active", value: project.is_active },
              { label: "AI Policy", value: project.custom_ai_policy === "1" ? "Active" : "Standard" },
              { label: "Frequency", value: project.frequency },
              { label: "Archived", value: project.custom_is_archived === 0 ? "No" : "Yes" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.label}</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[40px] p-8 shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users size={14} /> Project Roster
          </h3>
        </div>
        <div className="space-y-4">
          {(project.users || []).map((u, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-[24px] group hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-700 cursor-pointer">
              <div className="flex items-center gap-4">
                <img
                  src={u.image}
                  alt={u.full_name}
                  className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-700 shadow-sm"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${u.full_name}&background=6366f1&color=fff`; }}
                />
                <div>
                  <h4 className="text-sm font-black text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{u.full_name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate w-32">{u.email}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const REQUIRED_STATUSES = ["Draft", "Approved", "Rejected", "Implemented"];

const RequirementsTab = ({ projectId }) => {
  const { data, isLoading, mutate } = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_requirements",
    { project: projectId },
    projectId ? ["project_requirements", projectId] : null,
  );
  const submitMutation = useFrappePostCall("infintrix_atlas.api.v1.submit_portal_requirement");
  const statusMutation = useFrappePostCall("infintrix_atlas.api.v1.update_requirement_status");
  const createTaskMutation = useFrappePostCall("infintrix_atlas.api.v1.create_task_from_requirement");
  const phasesQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_phases",
    projectId ? { project: projectId } : undefined,
    projectId ? ["project_phases_dropdown", projectId] : null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(null);
  const [form] = Form.useForm();
  const [taskForm] = Form.useForm();

  const requirements = data?.message || [];
  const phases = phasesQuery?.data?.message || [];

  const handleStatusChange = (req, newStatus) => {
    statusMutation.call({ requirement: req.name, status: newStatus }).then(() => {
      message.success(`Requirement moved to ${newStatus}`);
      mutate();
    });
  };

  const handleCreateTask = (req) => {
    const activePhase = phases.find((p) => p.status === "Active");
    taskForm.setFieldsValue({
      subject: req.title,
      description: req.description || "",
      phase: activePhase?.name || phases[0]?.name || undefined,
    });
    setTaskModalOpen(req);
  };

  const handleTaskSubmit = () => {
    const req = taskModalOpen;
    if (!req) return;
    const values = taskForm.getFieldsValue();
    createTaskMutation.call({
      requirement: req.name,
      subject: values.subject,
      phase: values.phase,
    }).then(() => {
      message.success("Task created");
      taskForm.resetFields();
      setTaskModalOpen(null);
      mutate();
    });
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (t) => <span className="font-semibold">{t}</span> },
    {
      title: "Status", dataIndex: "status", key: "status", render: (s, r) => (
        <Select
          value={s}
          size="small"
          style={{ width: 120 }}
          onChange={(v) => handleStatusChange(r, v)}
          options={REQUIRED_STATUSES.map((st) => ({
            label: st,
            value: st,
          }))}
        />
      ),
    },
    { title: "Priority", dataIndex: "priority", key: "priority", render: (p) => (
      <Tag color={p === "High" ? "error" : p === "Medium" ? "warning" : "default"}>{p}</Tag>
    )},
    { title: "Source", dataIndex: "source", key: "source" },
    { title: "Tasks", dataIndex: "task_count", key: "task_count" },
    { title: "Owner", dataIndex: "owner_name", key: "owner_name" },
    {
      title: "Actions", key: "actions", render: (_, r) => (
        <Button type="link" icon={<PlusOutlined />} onClick={() => handleCreateTask(r)}>
          Create Task
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Requirements ({requirements.length})
        </h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Requirement
        </Button>
      </div>
      <Table
        dataSource={requirements}
        columns={columns}
        rowKey="name"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700"
        locale={{ emptyText: "No requirements yet" }}
      />

      <Modal
        title={`Create Task — [${taskModalOpen?.name}] ${taskModalOpen?.title || ""}`}
        open={!!taskModalOpen}
        onCancel={() => { setTaskModalOpen(null); taskForm.resetFields(); }}
        onOk={handleTaskSubmit}
        okText="Create Task"
        confirmLoading={createTaskMutation.loading}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item name="subject" label="Task Subject" rules={[{ required: true }]}>
            <Input placeholder="Task title" />
          </Form.Item>
          <Form.Item name="phase" label="Phase">
            <Select
              placeholder="Auto-detect (Active phase)"
              allowClear
              options={phases.map((p) => ({
                label: `${p.title} (${p.status})`,
                value: p.name,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="New Requirement"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            submitMutation.call({ project: projectId, ...values }).then(() => {
              message.success("Requirement created");
              form.resetFields();
              setModalOpen(false);
              mutate();
            });
          }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Requirement title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe the requirement" />
          </Form.Item>
          <Form.Item name="acceptance_criteria" label="Acceptance Criteria">
            <Input.TextArea rows={2} placeholder="What makes this complete?" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="Medium">
            <Select options={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }]} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitMutation.loading}>Create</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

const ChangeRequestsTab = ({ projectId }) => {
  const { data, isLoading, mutate } = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_change_requests",
    { project: projectId },
    projectId ? ["project_change_requests", projectId] : null,
  );
  const approveMutation = useFrappePostCall("infintrix_atlas.api.v1.approve_change_request");
  const rejectMutation = useFrappePostCall("infintrix_atlas.api.v1.reject_change_request");
  const implementMutation = useFrappePostCall("infintrix_atlas.api.v1.implement_change_request");
  const submitMutation = useFrappePostCall("infintrix_atlas.api.v1.submit_change_request");
  const requirementsQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_requirements",
    { project: projectId },
    projectId ? ["project_requirements_cr", projectId] : null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const changeRequests = data?.message || [];
  const requirements = requirementsQuery?.data?.message || [];

  const handleApprove = (cr) => {
    Modal.confirm({
      title: "Approve Change Request?",
      content: `This will approve "${cr.title}" and generate a new Requirement.`,
      okText: "Approve",
      cancelText: "Cancel",
      onOk: () => approveMutation.call({ change_request: cr.name }).then(() => { message.success("Change request approved"); mutate(); }),
    });
  };

  const handleReject = (cr) => {
    Modal.confirm({
      title: "Reject Change Request?",
      content: `Reject "${cr.title}"? The customer will be notified.`,
      okText: "Reject",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => rejectMutation.call({ change_request: cr.name }).then(() => { message.success("Change request rejected"); mutate(); }),
    });
  };

  const handleImplement = (cr) => {
    Modal.confirm({
      title: "Mark Change Request as Implemented?",
      content: `Mark "${cr.title}" as implemented?`,
      okText: "Implement",
      cancelText: "Cancel",
      onOk: () => implementMutation.call({ change_request: cr.name }).then(() => { message.success("Change request implemented"); mutate(); }),
    });
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (t) => <span className="font-semibold">{t}</span> },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => {
      const color = s === "Approved" ? "success" : s === "Rejected" ? "error" : s === "Implemented" ? "purple" : "processing";
      return <Tag color={color}>{s}</Tag>;
    }},
    { title: "Related Requirement", dataIndex: "related_requirement_title", key: "related_requirement_title", render: (r) => r || "-" },
    { title: "Impact", key: "impact", render: (_, r) => `${r.impact_hours || 0}h / ${r.impact_cost || 0} / ${r.impact_days || 0}d` },
    { title: "Date", dataIndex: "request_date", key: "request_date" },
    { title: "Actions", key: "actions", render: (_, r) => (
      <div className="flex gap-1">
        {r.status === "Under Review" && (
          <>
            <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleApprove(r)} loading={approveMutation.loading}>
              Approve
            </Button>
            <Button type="link" danger icon={<CloseCircleOutlined />} onClick={() => handleReject(r)} loading={rejectMutation.loading}>
              Reject
            </Button>
          </>
        )}
        {r.status === "Approved" && (
          <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleImplement(r)} loading={implementMutation.loading}>
            Implement
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Change Requests ({changeRequests.length})
        </h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Change Request
        </Button>
      </div>
      <Table
        dataSource={changeRequests}
        columns={columns}
        rowKey="name"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700"
        locale={{ emptyText: "No change requests yet" }}
      />
      <Modal title="New Change Request" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            submitMutation.call({ project: projectId, ...values }).then(() => {
              message.success("Change request submitted");
              form.resetFields();
              setModalOpen(false);
              mutate();
            });
          }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Change request title" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Describe the change" />
          </Form.Item>
          <Form.Item name="related_requirement" label="Related Requirement">
            <Select allowClear placeholder="Select requirement" options={requirements.map((r) => ({ label: r.title, value: r.name }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="impact_hours" label="Impact Hours"><Input type="number" min={0} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="impact_cost" label="Impact Cost"><Input type="number" min={0} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="impact_days" label="Impact Days"><Input type="number" min={0} /></Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitMutation.loading}>Submit</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

const ScopeSnapshotsTab = ({ projectId }) => {
  const { data, isLoading, mutate } = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_scope_snapshots",
    { project: projectId },
    projectId ? ["project_scope_snapshots", projectId] : null,
  );
  const createMutation = useFrappePostCall("infintrix_atlas.api.v1.create_scope_snapshot");

  const snapshots = data?.message || [];

  const handleCreate = () => {
    Modal.confirm({
      title: "Create Scope Baseline?",
      content: "This will capture a snapshot of all approved requirements as a new baseline.",
      okText: "Create",
      cancelText: "Cancel",
      onOk: () => createMutation.call({ project: projectId }).then(() => { message.success("Scope baseline created"); mutate(); }),
    });
  };

  const columns = [
    { title: "Version", dataIndex: "version", key: "version", render: (v) => <span className="font-semibold">{v}</span> },
    { title: "Date", dataIndex: "snapshot_date", key: "snapshot_date" },
    { title: "Requirements", dataIndex: "requirements_count", key: "requirements_count" },
    { title: "Status", dataIndex: "docstatus", key: "docstatus", render: (d) => (
      <Tag color={d === 1 ? "success" : "default"}>{d === 1 ? "Submitted" : "Draft"}</Tag>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Scope Baselines ({snapshots.length})
        </h3>
        <Button type="primary" icon={<Camera size={16} />} onClick={handleCreate} loading={createMutation.loading}>
          Create Baseline
        </Button>
      </div>
      <Table
        dataSource={snapshots}
        columns={columns}
        rowKey="name"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700"
        locale={{ emptyText: "No scope baselines yet" }}
      />
    </div>
  );
};

const ResourcesTab = ({ projectId }) => {
  const { data, isLoading } = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_resources",
    { project: projectId, include_internal: true },
    projectId ? ["project_resources", projectId] : null,
  );
  const resources = data?.message || [];

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (t) => <span className="font-semibold">{t}</span> },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Visibility", dataIndex: "visibility", key: "visibility" },
    { title: "Link", dataIndex: "link", key: "link", render: (l) => l ? <a href={l} target="_blank" rel="noopener noreferrer"><EyeOutlined /> View</a> : "-" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        Resources ({resources.length})
      </h3>
      <Table
        dataSource={resources}
        columns={columns}
        rowKey="name"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700"
        locale={{ emptyText: "No resources yet" }}
      />
    </div>
  );
};

const ActionRequestsTab = ({ projectId }) => {
  const { data, isLoading, mutate } = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_action_requests",
    { project: projectId, include_completed: true },
    projectId ? ["project_action_requests", projectId] : null,
  );
  const createMutation = useFrappePostCall("infintrix_atlas.api.v1.create_action_request");
  const completeMutation = useFrappePostCall("infintrix_atlas.api.v1.complete_action_request");
  const expireMutation = useFrappePostCall("infintrix_atlas.api.v1.expire_action_request");
  const phasesQuery = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_phases",
    { project: projectId },
    projectId ? ["project_phases_ar", projectId] : null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const actionRequests = data?.message || [];
  const phases = phasesQuery?.data?.message || [];

  const handleComplete = (ar) => {
    Modal.confirm({
      title: "Complete Action Request?",
      content: `Mark "${ar.title}" as completed?`,
      okText: "Complete",
      cancelText: "Cancel",
      onOk: () => completeMutation.call({ action_request: ar.name }).then(() => { message.success("Action request completed"); mutate(); }),
    });
  };

  const handleExpire = (ar) => {
    Modal.confirm({
      title: "Expire Action Request?",
      content: `Expire "${ar.title}"?`,
      okText: "Expire",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => expireMutation.call({ action_request: ar.name }).then(() => { message.success("Action request expired"); mutate(); }),
    });
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (t) => <span className="font-semibold">{t}</span> },
    { title: "Type", dataIndex: "action_type", key: "action_type", render: (t) => <Tag>{t}</Tag> },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => (
      <Tag color={s === "Completed" ? "success" : s === "Pending" ? "warning" : s === "Expired" ? "default" : "error"}>{s}</Tag>
    )},
    { title: "Phase", dataIndex: "phase_title", key: "phase_title", render: (p) => p || "-" },
    { title: "Due Date", dataIndex: "due_date", key: "due_date" },
    { title: "Actions", key: "actions", render: (_, r) => (
      r.status === "Pending" ? (
        <div className="flex gap-1">
          <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleComplete(r)} loading={completeMutation.loading}>
            Complete
          </Button>
          <Button type="link" danger icon={<CloseCircleOutlined />} onClick={() => handleExpire(r)} loading={expireMutation.loading}>
            Expire
          </Button>
        </div>
      ) : null
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Action Requests ({actionRequests.length})
        </h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Action Request
        </Button>
      </div>
      <Table
        dataSource={actionRequests}
        columns={columns}
        rowKey="name"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700"
        locale={{ emptyText: "No action requests yet" }}
      />
      <Modal title="New Action Request" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            createMutation.call({ project: projectId, ...values }).then(() => {
              message.success("Action request created");
              form.resetFields();
              setModalOpen(false);
              mutate();
            });
          }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Action title" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Describe the action needed" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="action_type" label="Action Type" initialValue="Approval">
                <Select options={[
                  { label: "Approval", value: "Approval" },
                  { label: "Document Submission", value: "Document Submission" },
                  { label: "Payment", value: "Payment" },
                  { label: "Feedback", value: "Feedback" },
                  { label: "Signature", value: "Signature" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phase" label="Phase">
                <Select allowClear placeholder="Auto-detect" options={phases.map((p) => ({ label: `${p.title} (${p.status})`, value: p.name }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="due_date" label="Due Date">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_portal_visible" label="Portal Visibility" initialValue={1}>
                <Select options={[{ label: "Visible to Customer", value: 1 }, { label: "Internal Only", value: 0 }]} />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.loading}>Create</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

const SectionProjectDetail = ({ project }) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const qp = useQueryParams();
  const projectId = qp.get("project") || project.name;

  const tabs = [
    { id: "Overview", label: "Overview", icon: Info },
    { id: "Requirements", label: "Requirements", icon: FileText },
    { id: "Change Requests", label: "Change Requests", icon: GitPullRequest },
    { id: "Scope Baselines", label: "Scope Baselines", icon: Camera },
    { id: "Resources", label: "Resources", icon: BookOpen },
    { id: "Action Requests", label: "Action Requests", icon: ListChecks },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview": return <OverviewTab project={project} />;
      case "Requirements": return <RequirementsTab projectId={projectId} />;
      case "Change Requests": return <ChangeRequestsTab projectId={projectId} />;
      case "Scope Baselines": return <ScopeSnapshotsTab projectId={projectId} />;
      case "Resources": return <ResourcesTab projectId={projectId} />;
      case "Action Requests": return <ActionRequestsTab projectId={projectId} />;
      default: return <OverviewTab project={project} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[48px] p-10 shadow-xl dark:shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="locked">{project.name}</Badge>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <Building2 size={12} /> {project.company}
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">
              {project.project_name}
            </h1>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Activity size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{project.status}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Layers size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{project.custom_execution_mode}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-2xl border border-amber-100 dark:border-amber-800">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">{project.priority} Priority</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * project.percent_complete) / 100} className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{project.percent_complete}%</span>
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Progress</span>
              </div>
            </div>
            {project.custom_enable_ai_architect === 1 && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 dark:bg-indigo-700 rounded-full shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50">
                <Sparkles size={12} className="text-white animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">AI Architect Enabled</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700 flex overflow-x-auto gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400"
                : "text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default function ProjectDetail() {
  const qp = useQueryParams();
  const project = qp.get("project") || "PROJ-0001";
  const project_query = useFrappeGetDoc("Project", project);

  if (project_query.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Activity size={48} className="text-indigo-500 animate-spin" />
          <p className="mt-4 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loading Project Details...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex font-sans text-slate-900 dark:text-white">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mx-auto h-full">
          <SectionProjectDetail project={project_query.data} />
        </div>
      </main>
    </div>
  );
}
