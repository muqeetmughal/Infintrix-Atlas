
export const PROJECT_STATUS_COLORS = {
  'Open': 'bg-blue-100 text-blue-700 border-blue-200',
  'Completed': 'bg-green-100 text-green-700 border-green-200',
  'Cancelled': 'bg-gray-100 text-gray-700 border-gray-200',
  'On Hold': 'bg-yellow-100 text-yellow-700 border-yellow-200'
};

export const TASK_STATUS_COLORS = {
  'Backlog': 'bg-slate-100 text-slate-600 border-slate-200',
  'Open': 'bg-blue-50 text-blue-600 border-blue-100',
  'Working': 'bg-amber-50 text-amber-700 border-amber-100',
  'Pending Review': 'bg-purple-50 text-purple-700 border-purple-100',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export const TASK_PRIORITY_COLORS = {
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-orange-100 text-orange-600',
  'High': 'bg-red-300 text-red-600',
  'Urgent': 'bg-purple-100 text-purple-600'
};

export const TEAM_MEMBERS = ['John Doe', 'Jane Smith', 'Alex Rivera', 'Sarah Chen', 'Mike Ross'];

export const INITIAL_PROJECTS = [
  { name: 'PROJ-001', project_name: 'Website Redesign', status: 'Open', percent_complete: 65, expected_end_date: '2024-06-15', project_type: 'Internal' },
  { name: 'PROJ-002', project_name: 'Mobile App Dev', status: 'Open', percent_complete: 25, expected_end_date: '2024-08-01', project_type: 'External' },
  { name: 'PROJ-003', project_name: 'Cloud Migration', status: 'Completed', percent_complete: 100, expected_end_date: '2023-12-20', project_type: 'Infrastructure' },
  { name: 'PROJ-004', project_name: 'Security Audit', status: 'On Hold', percent_complete: 10, expected_end_date: '2024-10-15', project_type: 'Internal' },
];

export const INITIAL_TASKS = [
  { id: 1, name: 'TASK-001', subject: 'Initial Wireframes', project: 'PROJ-001', status: 'Open', priority: 'Medium', exp_start_date: '2024-05-01', exp_end_date: '2024-05-10', assignee: 'Unassigned' },
  { id: 2, name: 'TASK-002', subject: 'Backend API Setup', project: 'PROJ-002', status: 'Working', priority: 'High', exp_start_date: '2024-05-05', exp_end_date: '2024-05-15', assignee: 'John Doe' },
  { id: 3, name: 'TASK-003', subject: 'Schema Design', project: 'PROJ-002', status: 'Completed', priority: 'Urgent', exp_start_date: '2024-04-20', exp_end_date: '2024-04-30', assignee: 'Jane Smith' },
  { id: 4, name: 'TASK-004', subject: 'Brand Identity', project: 'PROJ-001', status: 'Working', priority: 'Medium', exp_start_date: '2024-05-02', exp_end_date: '2024-05-20', assignee: 'Alex Rivera' },
  { id: 5, name: 'TASK-005', subject: 'SSL Configuration', project: 'PROJ-003', status: 'Completed', priority: 'Low', exp_start_date: '2023-12-01', exp_end_date: '2023-12-05', assignee: 'Sarah Chen' },
  { id: 6, name: 'TASK-006', subject: 'User Interview Sessions', project: 'PROJ-001', status: 'Pending Review', priority: 'High', exp_start_date: '2024-05-10', exp_end_date: '2024-05-18', assignee: 'Mike Ross' },
];