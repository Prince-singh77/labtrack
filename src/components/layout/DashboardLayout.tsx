import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Code2,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  key: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
  navItems: NavItem[];
  role: Role;
  roleColor: string;
}

export function DashboardLayout({
  children,
  activePage,
  onPageChange,
  navItems,
  role,
  roleColor,
}: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] =
    useState(0);

  const roleLabel =
    role.charAt(0).toUpperCase() + role.slice(1);

  useEffect(() => {
    if (!profile || role !== 'student') {
      setNotificationCount(0);
      return;
    }

    loadNotifications();
  }, [profile, role]);

  const loadNotifications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, created_at')
        .eq('activity_type', 'teacher_intervention')
        .eq('user_id', profile.id)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Failed to load notifications:',
          error
        );
        return;
      }

      if (!data || data.length === 0) {
        setNotificationCount(0);
        return;
      }

      const storageKey = `labtrack_notifications_read_${profile.id}`;

      const lastRead = localStorage.getItem(storageKey);

      if (!lastRead) {
        setNotificationCount(data.length);
        return;
      }

      const unread = data.filter(
        (notification) =>
          new Date(notification.created_at).getTime() >
          new Date(lastRead).getTime()
      );

      setNotificationCount(unread.length);
    } catch (error) {
      console.error(
        'Notification loading error:',
        error
      );
    }
  };

  const handleNotificationClick = () => {
    if (!profile) return;

    if (role === 'student') {
      const storageKey = `labtrack_notifications_read_${profile.id}`;

      localStorage.setItem(
        storageKey,
        new Date().toISOString()
      );

      setNotificationCount(0);

      // Student notices page
      onPageChange('notices');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-white',
                roleColor
              )}
            >
              <Code2 className="h-5 w-5" />
            </div>

            <span className="font-bold text-gray-900">
              LabTrack AI
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-gray-400 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 px-4 py-3">
          <div
            className={cn(
              'inline-block rounded-md px-2 py-0.5 text-xs font-semibold',
              roleColor,
              'bg-opacity-10'
            )}
          >
            {roleLabel}
          </div>

          <p className="mt-1 truncate text-sm font-medium text-gray-900">
            {profile?.full_name}
          </p>

          <p className="truncate text-xs text-gray-500">
            {profile?.email}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => {
                    onPageChange(item.key);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activePage === item.key
                      ? cn(roleColor, 'bg-gray-50')
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-error-50 hover:text-error-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-lg font-semibold text-gray-900">
              {navItems.find(
                (n) => n.key === activePage
              )?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={handleNotificationClick}
              className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={
                notificationCount > 0
                  ? `${notificationCount} unread notification${
                      notificationCount > 1
                        ? 's'
                        : ''
                    }`
                  : 'Notifications'
              }
            >
              <Bell className="h-5 w-5" />

              {/* Red notification badge */}
              {role === 'student' &&
                notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {notificationCount > 99
                      ? '99+'
                      : notificationCount}
                  </span>
                )}
            </button>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-semibold text-white">
              {profile?.full_name
                ?.charAt(0)
                .toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}