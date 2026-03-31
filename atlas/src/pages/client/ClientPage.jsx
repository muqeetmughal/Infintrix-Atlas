import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Card, Progress, Steps, Badge, Table, Button, 
  Modal, Form, Input, Select, Timeline, Tag, Collapse, Space, 
  Typography, Popover, List, Avatar, Divider, Tooltip, InputNumber, Upload
} from 'antd';
import { 
  LayoutDashboard, 
  Files, 
  GitPullRequest, 
  MessageSquarePlus, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Download,
  FileText,
  User,
  Zap,
  Bell,
  Search,
  MessageSquare,
  History,
  Info,
  Menu as MenuIcon,
  X,
  Plus,
  Paperclip
} from 'lucide-react';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

// --- ENHANCED MOCK DATA ---

const NOTIFICATIONS = [
  { id: 1, title: 'Change Request #102', description: 'Requires your approval to proceed.', type: 'critical', read: false, time: '2m ago' },
  { id: 2, title: 'File Uploaded', description: 'Technical_Spec_v2.pdf is ready for review.', type: 'info', read: false, time: '1h ago' },
  { id: 3, title: 'Task Completed', description: 'Database Schema Design finalized.', type: 'success', read: true, time: '3h ago' },
];

const PHASES = [
  { title: 'Discovery', status: 'finish', deadline: 'Jan 30' },
  { title: 'Design', status: 'process', deadline: 'Feb 15' },
  { title: 'Development', status: 'wait', deadline: 'Mar 30' },
  { title: 'UAT', status: 'wait', deadline: 'Apr 15' },
  { title: 'Go Live', status: 'wait', deadline: 'May 01' },
];

const MOCK_FILES = [
  { 
    id: 'f1', 
    name: 'SOW_Main.pdf', 
    phase: 'Discovery', 
    currentVersion: 'v2.4', 
    history: [
      { version: 'v2.4', date: 'Feb 10', user: 'Admin', note: 'Added multi-currency scope' },
      { version: 'v2.3', date: 'Jan 28', user: 'Admin', note: 'Initial draft' }
    ]
  },
  { id: 'f2', name: 'Mobile_Wireframes.fig', phase: 'Design', currentVersion: 'v1.0', history: [] },
];

// --- APP COMPONENT ---

const ClientPage = () => {
  const [currentScreen, setScreen] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState({ id: 1, name: 'ERPNext Customization', phase: 1, progress: 65, status: 'On Track', lead: 'Sarah Khan' });
  const [isActionModalOpen, setActionModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- SUB-COMPONENTS ---

  const NotificationCenter = () => (
    <Popover 
      placement="bottomRight" 
      title={<div className="flex justify-between items-center w-64"><span>Notifications</span><Button type="link" size="small">Mark all read</Button></div>}
      content={
        <List
          itemLayout="horizontal"
          dataSource={NOTIFICATIONS}
          renderItem={(item) => (
            <List.Item className={`cursor-pointer p-3 hover:bg-gray-50 ${!item.read ? 'bg-indigo-50/30' : ''}`}>
              <List.Item.Meta
                avatar={
                  <div className={`p-2 rounded-full ${item.type === 'critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {item.type === 'critical' ? <AlertCircle size={14}/> : <Info size={14}/>}
                  </div>
                }
                title={<span className="text-xs font-bold">{item.title}</span>}
                description={<div><div className="text-[10px] text-gray-500">{item.description}</div><div className="text-[10px] text-gray-400 mt-1">{item.time}</div></div>}
              />
            </List.Item>
          )}
        />
      }
      trigger="click"
    >
      <Badge count={2} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<Bell size={20} className="text-gray-500" />} />
      </Badge>
    </Popover>
  );

  const CommentSection = ({ targetId }) => (
    <div className="mt-6 border-t pt-6">
      <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
        <MessageSquare size={14} /> Discussion Thread
      </h4>
      <div className="space-y-4 mb-4 max-h-48 overflow-y-auto pr-2">
        <div className="flex gap-3">
          <Avatar size="small" className="bg-indigo-600">S</Avatar>
          <div className="bg-gray-100 p-3 rounded-xl rounded-tl-none flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold">Sarah (Lead)</span>
              <span className="text-[10px] text-gray-400">10:45 AM</span>
            </div>
            <p className="text-xs text-gray-700">I've updated the wireframes to include the currency toggle in the header as requested.</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Ask a question or clarify..." size="small" />
        <Button type="primary" size="small" icon={<Plus size={14} />} />
      </div>
    </div>
  );

  // --- SCREEN RENDERS ---

  const DashboardScreen = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <Title level={2}>Project Execution</Title>
          <Text type="secondary">Real-time visibility into your active work cycles.</Text>
        </div>
        <Input 
          prefix={<Search size={14} className="text-gray-400" />} 
          placeholder="Search tasks, files, or CRs..." 
          className="max-w-xs rounded-full"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hoverable onClick={() => setScreen('overview')} className="border-indigo-100 shadow-sm border-t-4 border-t-indigo-500">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">{selectedProject.name}</h3>
            <Tag color="green">Active</Tag>
          </div>
          <Progress percent={selectedProject.progress} strokeColor="#4f46e5" size="small" />
          <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
            <span>Next Milestone: Design Sign-off</span>
            <span>Feb 15</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={<span className="text-xs font-black uppercase tracking-widest">Awaiting Your Input</span>} className="shadow-sm">
          <List
            dataSource={[{ id: 'CR-102', title: 'Multi-Currency Approval', due: 'Urgent' }]}
            renderItem={item => (
              <List.Item actions={[<Button type="link" onClick={() => setScreen('changes')}>Review</Button>]}>
                <List.Item.Meta 
                  avatar={<AlertCircle className="text-amber-500" />}
                  title={<span className="font-bold text-sm">{item.title}</span>}
                  description={<Tag color="red" size="small">{item.due}</Tag>}
                />
              </List.Item>
            )}
          />
        </Card>
        <Card title={<span className="text-xs font-black uppercase tracking-widest">Recent System Log</span>} className="shadow-sm">
          <Timeline 
            items={[
              { children: 'v2.4 of SOW uploaded by Sarah', color: 'blue' },
              { children: 'Cycle 2 started: UI Prototyping', color: 'gray' },
            ]}
          />
        </Card>
      </div>
    </div>
  );

  const ActionRequestScreen = () => (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>Action Requests</Title>
          <Paragraph type="secondary">All feedback and new ideas must be logged here to be reviewed for scope impact.</Paragraph>
        </div>
        <Button type="primary" icon={<Plus size={16} />} className="bg-indigo-600" onClick={() => setActionModalOpen(true)}>
          New Request
        </Button>
      </div>

      <Table 
        rowKey="id"
        dataSource={[
          { id: 'AR-45', title: 'Add Dark Mode to Dashboard', status: 'Under Review', priority: 'Low', date: 'Feb 12' },
          { id: 'AR-46', title: 'Export to CSV functionality', status: 'Approved', priority: 'High', date: 'Feb 14' },
        ]}
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id', render: id => <span className="font-mono text-xs">{id}</span> },
          { title: 'Request Title', dataIndex: 'title', key: 'title', render: t => <span className="font-bold">{t}</span> },
          { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'Approved' ? 'green' : 'blue'}>{s}</Tag> },
          { title: 'Priority', dataIndex: 'priority', key: 'priority', render: p => <Badge status={p === 'High' ? 'error' : 'default'} text={p} /> },
          { title: 'Actions', key: 'actions', render: () => <Button type="text" icon={<ChevronRight size={16}/>} /> }
        ]}
      />
    </div>
  );

  const ChangeRequestScreen = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Title level={2}>Change Requests</Title>
        <Text type="secondary">Formal adjustments to the original Statement of Work.</Text>
      </div>

      <Card className="border-2 border-amber-100 shadow-lg">
        <div className="flex justify-between mb-6">
          <Tag color="orange" icon={<Clock size={12} className="inline mr-1" />}>Awaiting Your Approval</Tag>
          <Text className="font-mono text-gray-400">CR-102</Text>
        </div>
        
        <Title level={4}>Expansion: Multi-Currency Support</Title>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="text-[10px] font-black text-red-800 uppercase mb-1">Budget Impact</div>
            <div className="text-xl font-bold text-red-600">+$1,200 USD</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="text-[10px] font-black text-amber-800 uppercase mb-1">Time Impact</div>
            <div className="text-xl font-bold text-amber-600">+18 Dev Hours</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-[10px] font-black text-gray-800 uppercase mb-1">Timeline Shift</div>
            <div className="text-xl font-bold text-gray-800">+1.5 Weeks</div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-white border rounded-lg">
            <Text type="secondary" className="text-xs font-bold uppercase">Impact on Deliverables</Text>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
              <li>New "Currency Exchange" service in backend</li>
              <li>Frontend toggle for USD/PKR/AED</li>
              <li>Updated PDF invoice template</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <Button size="large" className="flex-1 font-bold">Reject</Button>
          <Button size="large" type="primary" className="flex-[2] font-bold bg-indigo-600 h-auto py-3">
            Confirm & Update SOW
          </Button>
        </div>

        <Divider />
        
        {/* Audit Trail & Decision Log */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-[10px] font-black uppercase text-gray-400 mb-3 flex items-center gap-2">
            <History size={12} /> Decision Audit Log
          </h5>
          <Timeline 
            className="text-xs"
            items={[
              { children: 'Initial request logged by Client (AR-42)', color: 'blue' },
              { children: 'Scope analysis completed by Infintrix Tech Lead', color: 'blue' },
              { children: 'Impact Summary generated (Feb 14)', color: 'gray' },
            ]}
          />
        </div>

        <CommentSection targetId="CR-102" />
      </Card>
    </div>
  );

  const FilesScreen = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Files & Versioning</Title>
        <Button icon={<Download size={16} />}>Download All (ZIP)</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MOCK_FILES.map(file => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{file.name}</h4>
                  <Space split={<Divider type="vertical" />}>
                    <Tag color="blue" className="text-[10px]">{file.phase}</Tag>
                    <Badge status="processing" text={<span className="text-xs font-bold text-indigo-600">Latest: {file.currentVersion}</span>} />
                  </Space>
                </div>
              </div>
              <Button.Group>
                <Button icon={<Download size={16} />} />
                <Popover 
                  content={
                    <List
                      className="w-64"
                      dataSource={file.history}
                      renderItem={h => (
                        <List.Item className="text-xs">
                          <div>
                            <div className="font-bold">{h.version} • {h.date}</div>
                            <div className="text-gray-500 italic">"{h.note}"</div>
                          </div>
                          <Button type="text" size="small" icon={<Download size={12}/>}/>
                        </List.Item>
                      )}
                    />
                  }
                  title="Version History"
                  trigger="click"
                >
                  <Button icon={<History size={16} />} />
                </Popover>
              </Button.Group>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen bg-[#fcfcfd]">
      <Sider 
        theme="light" 
        className="border-r border-gray-100 hidden md:block" 
        width={240}
        collapsible 
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div className="p-6 flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center">
            <Zap size={18} className="text-white fill-current" />
          </div>
          {!collapsed && <span className="font-bold text-lg tracking-tight text-gray-800">INFINTRIX</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentScreen]}
          onClick={({ key }) => setScreen(key)}
          className="border-none"
          items={[
            { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { key: 'actions', icon: <MessageSquarePlus size={18} />, label: 'Action Requests' },
            { key: 'changes', icon: <GitPullRequest size={18} />, label: 'Change Requests' },
            { key: 'files', icon: <Files size={18} />, label: 'Files & Audit' },
          ]}
        />
      </Sider>

      <Layout>
        <Header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 h-16">
          <Button 
            type="text" 
            className="md:hidden" 
            icon={<MenuIcon size={20} />} 
          />
          <div className="flex-1" />
          <Space size="large">
            <NotificationCenter />
            <Tooltip title="View Master SOW">
              <Button type="text" icon={<FileText size={20} className="text-gray-400" />} />
            </Tooltip>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold leading-none">Client Admin</div>
                <div className="text-[10px] text-gray-400">Acme Corp</div>
              </div>
              <Avatar icon={<User size={16}/>} className="bg-gray-200 text-gray-500" />
            </div>
          </Space>
        </Header>

        <Content className="p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
          {currentScreen === 'dashboard' && <DashboardScreen />}
          {currentScreen === 'overview' && (
            <div className="space-y-6">
               <div className="flex items-center gap-2 text-gray-400 mb-2 cursor-pointer" onClick={() => setScreen('dashboard')}>
                <ChevronRight className="rotate-180" size={16} />
                <span className="text-sm font-medium">Back to Projects</span>
              </div>
              <Title level={2}>{selectedProject.name}</Title>
              <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                <Steps 
                  current={selectedProject.phase} 
                  items={PHASES.map(p => ({ 
                    title: p.title, 
                    description: <span className="text-[10px] font-bold text-gray-400">Due {p.deadline}</span> 
                  }))}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Active Cycle" className="shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold">Week 6: API Integration</h4>
                      <Tag color="blue">Processing</Tag>
                   </div>
                   <Progress percent={45} status="active" />
                   <Button block className="mt-6" onClick={() => setScreen('phase-detail')}>Drill into Cycle Tasks</Button>
                </Card>
                <Card title="Recent Activity" className="shadow-sm">
                  <Timeline items={[{children: 'New Comment on CR-102'}, {children: 'Task "OAuth Fix" moved to UAT'}]}/>
                </Card>
              </div>
            </div>
          )}
          {currentScreen === 'phase-detail' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-gray-400 mb-2 cursor-pointer" onClick={() => setScreen('overview')}>
                <ChevronRight className="rotate-180" size={16} />
                <span className="text-sm font-medium">Back to Overview</span>
              </div>
              <Card title="Cycle 6 Detail" extra={<Tag color="blue">Week of Feb 14</Tag>}>
                <Table 
                  dataSource={[{id: 1, task: 'REST API Setup', status: 'Done'}, {id: 2, task: 'Auth Hook', status: 'In Progress'}]}
                  rowKey="id"
                  pagination={false}
                  columns={[{title: 'Task', dataIndex: 'task'}, {title: 'Status', dataIndex: 'status', render: s => <Badge status={s === 'Done' ? 'success' : 'processing'} text={s}/>}]}
                />
              </Card>
              <CommentSection targetId="phase-2"/>
            </div>
          )}
          {currentScreen === 'actions' && <ActionRequestScreen />}
          {currentScreen === 'changes' && <ChangeRequestScreen />}
          {currentScreen === 'files' && <FilesScreen />}
        </Content>
      </Layout>

      {/* ACTION REQUEST MODAL */}
      <Modal
        title={<div className="flex items-center gap-2"><MessageSquarePlus className="text-indigo-600" size={20}/> New Action Request</div>}
        open={isActionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setActionModalOpen(false)}>Discard</Button>,
          <Button key="submit" type="primary" className="bg-indigo-600" onClick={() => setActionModalOpen(false)}>Submit Request</Button>
        ]}
      >
        <Form layout="vertical" className="mt-4">
          <Form.Item label="Request Title" required>
            <Input placeholder="e.g. Export feature for invoice table" />
          </Form.Item>
          <Form.Item label="Context / Description" required>
            <Input.TextArea rows={4} placeholder="What problem are we solving? Please be as specific as possible." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Priority">
              <Select defaultValue="medium">
                <Option value="low">Low (Wishlist)</Option>
                <Option value="medium">Medium (Standard)</Option>
                <Option value="high">High (Blocking)</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Related Phase">
              <Select placeholder="Optional">
                {PHASES.map(p => <Option key={p.title}>{p.title}</Option>)}
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Attachments">
            <div className="border-2 border-dashed border-gray-200 p-8 rounded-xl text-center hover:border-indigo-300 transition-colors cursor-pointer">
              <Paperclip className="mx-auto text-gray-400 mb-2" />
              <div className="text-xs text-gray-500">Click or drag screenshots/files to upload</div>
            </div>
          </Form.Item>
          <div className="bg-blue-50 p-3 rounded-lg flex gap-3">
             <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
             <p className="text-[10px] text-blue-800 leading-relaxed">
               Note: New requests are reviewed for <strong>Statement of Work (SOW) compliance</strong>. 
               If a request falls outside original scope, it will be converted to a Change Request for your approval.
             </p>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ClientPage;