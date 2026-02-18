import {
  LayoutDashboard,
  Briefcase,
  User,
  UserCircle,
} from 'lucide-react';

export const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    // { id: 'tasks/kanban', label: 'Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team', icon: User },
    { id: 'customer-portal', label: 'Customer Portal', icon: UserCircle },
];
