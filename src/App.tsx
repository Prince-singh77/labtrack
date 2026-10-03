import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/EmptyState';
import { LandingPage } from '@/pages/LandingPage';
import { StudentApp } from '@/pages/student/StudentApp';
import { TeacherApp } from '@/pages/teacher/TeacherApp';
import { AdminApp } from '@/pages/admin/AdminApp';

function App() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
          <p className="text-sm text-gray-500">Loading LabTrack AI...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <LandingPage />;
  }

  switch (profile.role) {
    case 'student': return <StudentApp />;
    case 'teacher': return <TeacherApp />;
    case 'admin': return <AdminApp />;
    default: return <LandingPage />;
  }
}

export default App;
