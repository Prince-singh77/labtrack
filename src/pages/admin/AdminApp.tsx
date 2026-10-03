import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, FlaskConical,
  Bell, BarChart3, Settings
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminBatches } from './AdminBatches';
import { AdminSubjects } from './AdminSubjects';
import { AdminLabs } from './AdminLabs';
import { AdminNotices } from './AdminNotices';
import { AdminAchievements } from './AdminAchievements';

const navItems = [
  { label: 'Dashboard', key: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Users', key: 'users', icon: <Users className="h-4 w-4" /> },
  { label: 'Batches', key: 'batches', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Subjects', key: 'subjects', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Labs', key: 'labs', icon: <FlaskConical className="h-4 w-4" /> },
  { label: 'Notices', key: 'notices', icon: <Bell className="h-4 w-4" /> },
  { label: 'Achievements', key: 'achievements', icon: <Settings className="h-4 w-4" /> },
];

export function AdminApp() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <AdminDashboard />;
      case 'users': return <AdminUsers />;
      case 'batches': return <AdminBatches />;
      case 'subjects': return <AdminSubjects />;
      case 'labs': return <AdminLabs />;
      case 'notices': return <AdminNotices />;
      case 'achievements': return <AdminAchievements />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <DashboardLayout activePage={page} onPageChange={setPage} navItems={navItems} role="admin" roleColor="text-warning-600 bg-warning-50">
      {renderPage()}
    </DashboardLayout>
  );
}
