import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Code2, GraduationCap,Lightbulb,
Brain, Users, Trophy, AlertCircle } from 'lucide-react';
import type { Role } from '@/types';

interface AuthModalProps {
  open: boolean;
  role: Role;
  onClose: () => void;
}

const roleConfig: Record<Role, { label: string; icon: any; color: string }> = {
  student: { label: 'Student', icon: GraduationCap, color: 'text-primary-600 bg-primary-50' },
  teacher: { label: 'Teacher', icon: Users, color: 'text-accent-600 bg-accent-50' },
  admin: { label: 'Admin', icon: Trophy, color: 'text-warning-600 bg-warning-50' },
};

export function AuthModal({ open, role, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [batchId, setBatchId] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && role === 'student') {
      supabase.from('batches').select('*').order('name').then(({ data }) => {
        if (data) setBatches(data);
      });
    }
  }, [open, role]);

  useEffect(() => {
    setError(null);
  }, [mode, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, role, batchId || undefined, rollNumber || undefined);
      if (error) setError(error);
    }
    setLoading(false);
  };

  const config = roleConfig[role];
  const RoleIcon = config.icon;

  return (
    <Modal open={open} onClose={onClose} title={`${mode === 'login' ? 'Sign In' : 'Sign Up'} — ${config.label}`}>
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
          <RoleIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{config.label} Portal</p>
          <p className="text-xs text-gray-500">{mode === 'login' ? 'Welcome back!' : 'Create your account'}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div>
              <label className="label">Full Name</label>
              <input className="input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required />
            </div>
            {role === 'student' && (
              <>
                <div>
                  <label className="label">Roll Number</label>
                  <input className="input" type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 21CS001" />
                </div>
                <div>
                  <label className="label">Batch</label>
                  <select className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                    <option value="">Select a batch (optional)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} — {b.department}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="font-semibold text-primary-600 hover:text-primary-700"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </Modal>
  );
}
