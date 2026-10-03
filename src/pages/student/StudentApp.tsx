import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  LayoutDashboard, FlaskConical, Code2, FileText, TrendingUp, BookOpen,
  Brain, Trophy, HelpCircle, Bell, User
} from 'lucide-react';
import { StudentDashboard } from './StudentDashboard';
import { StudentLabs } from './StudentLabs';
import { StudentPractice } from './StudentPractice';
import { StudentSubmissions } from './StudentSubmissions';
import { StudentProgress } from './StudentProgress';
import { StudentNotebook } from './StudentNotebook';
import { StudentQuizzes } from './StudentQuizzes';
import { StudentAchievements } from './StudentAchievements';
import { StudentHelpRequests } from './StudentHelpRequests';
import { StudentNotices } from './StudentNotices';
import { StudentProfile } from './StudentProfile';

const navItems = [
  { label: 'Dashboard', key: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'My Labs', key: 'labs', icon: <FlaskConical className="h-4 w-4" /> },
  { label: 'Practice', key: 'practice', icon: <Code2 className="h-4 w-4" /> },
  { label: 'Submissions', key: 'submissions', icon: <FileText className="h-4 w-4" /> },
  { label: 'Progress', key: 'progress', icon: <TrendingUp className="h-4 w-4" /> },
  { label: 'Practical Notebook', key: 'notebook', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Quizzes', key: 'quizzes', icon: <Brain className="h-4 w-4" /> },
  { label: 'Achievements', key: 'achievements', icon: <Trophy className="h-4 w-4" /> },
  { label: 'Help Requests', key: 'help', icon: <HelpCircle className="h-4 w-4" /> },
  { label: 'Notices', key: 'notices', icon: <Bell className="h-4 w-4" /> },
  { label: 'Profile', key: 'profile', icon: <User className="h-4 w-4" /> },
];

export function StudentApp() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <StudentDashboard />;
      case 'labs': return <StudentLabs />;
      case 'practice': return <StudentPractice />;
      case 'submissions': return <StudentSubmissions />;
      case 'progress': return <StudentProgress />;
      case 'notebook': return <StudentNotebook />;
      case 'quizzes': return <StudentQuizzes />;
      case 'achievements': return <StudentAchievements />;
      case 'help': return <StudentHelpRequests />;
      case 'notices': return <StudentNotices />;
      case 'profile': return <StudentProfile />;
      default: return <StudentDashboard />;
    }
  };

  return (
    <DashboardLayout activePage={page} onPageChange={setPage} navItems={navItems} role="student" roleColor="text-primary-600 bg-primary-50">
      {renderPage()}
    </DashboardLayout>
  );
}
