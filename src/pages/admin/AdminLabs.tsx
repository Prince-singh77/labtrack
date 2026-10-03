import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { FlaskConical, Trash2 } from 'lucide-react';
import type { Lab } from '@/types';

export function AdminLabs() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState<(Lab & { subject?: any; batch?: any; teacher?: any })[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('labs')
        .select('*, subject(name, code), batch(name), teacher(full_name)')
        .order('created_at', { ascending: false });
      setLabs(data as any || []);
      setLoading(false);
    })();
  }, [profile]);

  const deleteLab = async (id: string) => {
    if (!confirm('Delete this lab and all its content?')) return;
    await supabase.from('labs').delete().eq('id', id);
    const { data } = await supabase.from('labs').select('*, subject(name, code), batch(name), teacher(full_name)').order('created_at', { ascending: false });
    setLabs(data as any || []);
  };

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">All Labs</h2>
        <p className="mt-1 text-gray-500">View and manage all labs across the platform.</p>
      </div>

      {labs.length === 0 ? (
        <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No labs yet" description="Teachers will create labs from their dashboard." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {labs.map((lab) => (
            <Card key={lab.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{lab.name}</h3>
                    <p className="text-xs text-gray-500">{lab.subject?.name} ({lab.subject?.code})</p>
                  </div>
                </div>
                <button onClick={() => deleteLab(lab.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="text-gray-600 bg-gray-50 border-gray-200">Batch: {lab.batch?.name || 'All'}</Badge>
                <Badge className="text-gray-600 bg-gray-50 border-gray-200">Teacher: {lab.teacher?.full_name || 'Unassigned'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
