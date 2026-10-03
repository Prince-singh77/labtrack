import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { FlaskConical, FolderOpen, Code2, BookOpen } from 'lucide-react';
import type { Lab, Subject, Topic, Program } from '@/types';

export function StudentLabs() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState<(Lab & { subject?: Subject; topics: (Topic & { programs: Program[] })[]; _programCount?: number })[]>([]);
  const [expandedLab, setExpandedLab] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('labs')
        .select(`
          *,
          subject(*),
          topics(*, programs(*))
        `)
        .eq('batch_id', profile.batch_id)
        .order('created_at', { ascending: false });

      setLabs(data as any || []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Labs</h2>
        <p className="mt-1 text-gray-500">Browse your assigned labs, topics, and programs.</p>
      </div>

      {labs.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="h-6 w-6" />}
          title="No labs assigned yet"
          description="Your labs will appear here once a teacher assigns them to your batch."
        />
      ) : (
        <div className="space-y-4">
          {labs.map((lab) => {
            const programCount = lab.topics?.reduce((sum, t) => sum + (t.programs?.length || 0), 0) || 0;
            const isExpanded = expandedLab === lab.id;
            return (
              <Card key={lab.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedLab(isExpanded ? null : lab.id)}
                  className="flex w-full items-center justify-between p-5 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <FlaskConical className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lab.name}</h3>
                      <p className="text-sm text-gray-500">{lab.subject?.name} · {lab.topics?.length || 0} topics · {programCount} programs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="text-primary-700 bg-primary-50 border-primary-200">{lab.subject?.code}</Badge>
                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    {lab.description && <p className="mb-4 text-sm text-gray-600">{lab.description}</p>}
                    <div className="space-y-4">
                      {lab.topics?.map((topic) => (
                        <div key={topic.id} className="rounded-lg border border-gray-100 p-4">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-primary-500" />
                            <h4 className="font-medium text-gray-900">{topic.name}</h4>
                            <Badge className="text-gray-600 bg-gray-50 border-gray-200">{topic.programs?.length || 0} programs</Badge>
                          </div>
                          {topic.description && <p className="mt-1 text-sm text-gray-500">{topic.description}</p>}
                          {topic.programs && topic.programs.length > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {topic.programs.map((prog) => (
                                <div key={prog.id} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
                                  <Code2 className="h-4 w-4 text-gray-400" />
                                  <span className="truncate text-sm text-gray-700">{prog.title}</span>
                                  <Badge className={`ml-auto ${prog.difficulty === 'easy' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : prog.difficulty === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                                    {prog.difficulty}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
