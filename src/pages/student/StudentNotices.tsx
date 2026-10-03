import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Bell, Zap } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Notice } from '@/types';

export function StudentNotices() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .or('audience.eq.all,audience.eq.students')
        .order('created_at', { ascending: false });
      setNotices(data as Notice[] || []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notices</h2>
        <p className="mt-1 text-gray-500">Announcements from your teachers and administrators.</p>
      </div>

      {notices.length === 0 ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="No notices" description="New announcements will appear here." />
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 flex-shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <Badge className="text-gray-600 bg-gray-50 border-gray-200 capitalize">{n.audience}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{n.content}</p>
                  <p className="mt-2 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
