import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Award, Plus, Pencil, Trash2, Trophy, CheckCircle2, Brain, Flame, BookOpen, Heart, Sparkles } from 'lucide-react';
import type { Achievement } from '@/types';

const iconOptions = [
  { value: 'check-circle', label: 'Check Circle', icon: CheckCircle2 },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'brain', label: 'Brain', icon: Brain },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'flame', label: 'Flame', icon: Flame },
  { value: 'book-open', label: 'Book', icon: BookOpen },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'trophy', label: 'Trophy', icon: Trophy },
];

export function AdminAchievements() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: 'award', points: 10 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('achievements').select('*').order('points');
      setAchievements(data as Achievement[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const save = async () => {
    setSaving(true);
    if (editing) {
      await supabase.from('achievements').update(form).eq('id', editing.id);
    } else {
      await supabase.from('achievements').insert(form);
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', description: '', icon: 'award', points: 10 });
    const { data } = await supabase.from('achievements').select('*').order('points');
    setAchievements(data as Achievement[] || []);
  };

  const deleteAchievement = async (id: string) => {
    if (!confirm('Delete this achievement?')) return;
    await supabase.from('achievements').delete().eq('id', id);
    const { data } = await supabase.from('achievements').select('*').order('points');
    setAchievements(data as Achievement[] || []);
  };

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
          <p className="mt-1 text-gray-500">Define badges and milestones for students to earn.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', description: '', icon: 'award', points: 10 }); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New Achievement
        </button>
      </div>

      {achievements.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="No achievements" description="Create achievements to gamify student progress." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => {
            const IconEntry = iconOptions.find(i => i.value === ach.icon);
            const Icon = IconEntry?.icon || Award;
            return (
              <Card key={ach.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-warning-400 to-amber-500 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ach.name}</h3>
                      <p className="text-sm text-gray-600">{ach.description}</p>
                      <Badge className="text-warning-700 bg-warning-50 border-warning-200 mt-2">+{ach.points} points</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(ach); setForm({ name: ach.name, description: ach.description, icon: ach.icon, points: ach.points }); setShowModal(true); }} className="btn-ghost text-xs"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteAchievement(ach.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Achievement' : 'Create Achievement'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 20 Programs Completed" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Complete 20 programs across all labs" />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="grid grid-cols-4 gap-2">
              {iconOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} type="button" onClick={() => setForm({ ...form, icon: opt.value })}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${form.icon === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <Icon className="h-5 w-5 text-gray-700" />
                    <span className="text-[10px] text-gray-500">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label">Points</label>
            <input type="number" className="input" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
          </div>
          <button onClick={save} disabled={saving || !form.name || !form.description} className="btn-primary w-full">
            {saving ? 'Saving...' : editing ? 'Update Achievement' : 'Create Achievement'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
