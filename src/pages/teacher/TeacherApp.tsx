import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  LayoutDashboard, ClipboardList, Code2, Brain, BookOpen, Users,
  BarChart3, FileText, Bell, Settings, HelpCircle
} from 'lucide-react';
import { TeacherDashboard } from './TeacherDashboard';
import { TeacherLabs } from './TeacherLabs';
import { TeacherPrograms } from './TeacherPrograms';
import { TeacherQuizzes } from './TeacherQuizzes';
import { TeacherNotebookTemplates } from './TeacherNotebookTemplates';
import { TeacherStudents } from './TeacherStudents';
import { TeacherAnalytics } from './TeacherAnalytics';
import { TeacherSubmissions } from './TeacherSubmissions';
import { TeacherNotices } from './TeacherNotices';
import { TeacherAiNotes } from './TeacherAiNotes';
import { TeacherHelpRequests } from './TeacherHelpRequests';

const navItems = [
  { label: 'Dashboard', key: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Labs', key: 'labs', icon: <ClipboardList className="h-4 w-4" /> },
  { label: 'Programs', key: 'programs', icon: <Code2 className="h-4 w-4" /> },
  { label: 'Submissions', key: 'submissions', icon: <FileText className="h-4 w-4" /> },
  { label: 'Quizzes', key: 'quizzes', icon: <Brain className="h-4 w-4" /> },
  { label: 'Notebook Templates', key: 'notebook', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'AI Notes', key: 'ainotes', icon: <Settings className="h-4 w-4" /> },
  { label: 'Students', key: 'students', icon: <Users className="h-4 w-4" /> },
  { label: 'Analytics', key: 'analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Help Requests', key: 'help', icon: <HelpCircle className="h-4 w-4" /> },
  { label: 'Notices', key: 'notices', icon: <Bell className="h-4 w-4" /> },
];

export function TeacherApp() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <TeacherDashboard onNavigate={setPage} />;
      case 'labs': return <TeacherLabs />;
      case 'programs': return <TeacherPrograms />;
      case 'submissions': return <TeacherSubmissions />;
      case 'quizzes': return <TeacherQuizzes />;
      case 'notebook': return <TeacherNotebookTemplates />;
      case 'ainotes': return <TeacherAiNotes />;
      case 'students': return <TeacherStudents />;
      case 'analytics': return <TeacherAnalytics />;
      case 'help': return <TeacherHelpRequests />;
      case 'notices': return <TeacherNotices />;
      default: return <TeacherDashboard onNavigate={setPage} />;
    }
  };

  return (
    <DashboardLayout activePage={page} onPageChange={setPage} navItems={navItems} role="teacher" roleColor="text-accent-600 bg-accent-50">
      {renderPage()}
    </DashboardLayout>
  );
}
