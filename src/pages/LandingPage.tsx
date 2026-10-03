import { useState } from 'react';
import {
  Code2, GraduationCap, BookOpen, TrendingUp, Award, Brain, FileText,
  CheckCircle2, Users, ClipboardList, Flame, Target, ArrowRight, Zap,
  Trophy, HelpCircle, Menu, X, Sparkles, BarChart3, Calendar
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import type { Role } from '@/types';

export function LandingPage() {
  const [authModal, setAuthModal] = useState<{ open: boolean; role: Role }>({ open: false, role: 'student' });
  const [mobileMenu, setMobileMenu] = useState(false);

  const openAuth = (role: Role) => {
    setAuthModal({ open: true, role });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 text-white">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">LabTrack <span className="text-primary-600">AI</span></span>
          </div>
          <div className="hidden items-center gap-1 md:flex">
            <button onClick={() => openAuth('student')} className="btn-ghost">Student Login</button>
            <button onClick={() => openAuth('teacher')} className="btn-ghost">Teacher Login</button>
            <button onClick={() => openAuth('admin')} className="btn-primary">Admin Login</button>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 text-gray-600 md:hidden">
            {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
            <button onClick={() => openAuth('student')} className="block w-full py-2 text-left text-gray-600">Student Login</button>
            <button onClick={() => openAuth('teacher')} className="block w-full py-2 text-left text-gray-600">Teacher Login</button>
            <button onClick={() => openAuth('admin')} className="block w-full py-2 text-left font-semibold text-primary-600">Admin Login</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-white to-white" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-accent-200/20 blur-3xl" />
        <div className="absolute left-0 top-40 h-72 w-72 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Practice. Progress. Prove.
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl animate-slide-up">
              Make every <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">lab</span> count.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 animate-slide-up">
              Smart lab practice, progress tracking, practical notebooks and learning analytics — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-slide-up">
              <button onClick={() => openAuth('student')} className="btn-primary w-full sm:w-auto">
                <GraduationCap className="h-5 w-5" /> Student Login
              </button>
              <button onClick={() => openAuth('teacher')} className="btn-secondary w-full sm:w-auto">
                <Users className="h-5 w-5" /> Teacher Login
              </button>
              <button onClick={() => openAuth('admin')} className="btn-accent w-full sm:w-auto">
                <Trophy className="h-5 w-5" /> Admin Login
              </button>
            </div>
          </div>

          {/* Hero stats */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: 'Programs Tracked', value: '500+', icon: <Code2 className="h-5 w-5" /> },
              { label: 'Active Students', value: '1,200+', icon: <Users className="h-5 w-5" /> },
              { label: 'Quiz Questions', value: '300+', icon: <Brain className="h-5 w-5" /> },
              { label: 'Notebook Entries', value: '5,000+', icon: <BookOpen className="h-5 w-5" /> },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">{s.icon}</div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How LabTrack Works</h2>
            <p className="mt-3 text-gray-600">A simple, structured flow from assignment to completion</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', title: 'Get Assigned', desc: 'Teachers create labs, topics, and programming questions assigned to your batch.', icon: <ClipboardList className="h-6 w-6" /> },
              { step: '02', title: 'Practice in VS Code', desc: 'Write and run programs on your own computer — no online compiler needed.', icon: <Code2 className="h-6 w-6" /> },
              { step: '03', title: 'Submit & Get Verified', desc: 'Submit your code, output, and explanation. Teachers verify your work.', icon: <CheckCircle2 className="h-6 w-6" /> },
              { step: '04', title: 'Track Progress', desc: 'Watch your streaks grow, quizzes unlock, and notebook entries fill up.', icon: <TrendingUp className="h-6 w-6" /> },
            ].map((s) => (
              <div key={s.step} className="card p-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary-200">{s.step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">{s.icon}</div>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
            <p className="mt-3 text-gray-600">Everything you need to manage programming labs effectively</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Lab & Program Management', desc: 'Teachers create subjects, labs, topics, and programming questions with difficulty levels, test cases, and deadlines.', icon: <ClipboardList className="h-6 w-6" /> },
              { title: 'Submission Verification', desc: 'Students submit code, output, and explanation. Teachers verify and provide feedback before marking complete.', icon: <CheckCircle2 className="h-6 w-6" /> },
              { title: 'Coding Streaks', desc: 'GitHub-style activity calendar tracks meaningful lab activity with current and longest streak tracking.', icon: <Flame className="h-6 w-6" /> },
              { title: 'Progress Analytics', desc: 'Interactive charts show completion rates, topic-wise progress, quiz trends, and weekly activity.', icon: <BarChart3 className="h-6 w-6" /> },
              { title: 'Smart Practical Notebook', desc: 'Auto-generates notebook entries when programs are completed. Print-ready, professional layout.', icon: <BookOpen className="h-6 w-6" /> },
              { title: 'Quiz System', desc: 'Quizzes unlock after completing required programs. MCQ, output, debug, and concept question types.', icon: <Brain className="h-6 w-6" /> },
              { title: 'Gamification', desc: 'Points, badges, achievements, and milestones keep students motivated throughout the semester.', icon: <Trophy className="h-6 w-6" /> },
              { title: 'AI Notes', desc: 'Template-based notes generator for aim, theory, algorithm, and viva questions — no paid API needed.', icon: <Zap className="h-6 w-6" /> },
              { title: 'Attendance Eligibility', desc: 'Lab activity-based eligibility signal for manual ERP use — clearly not a replacement for official attendance.', icon: <Calendar className="h-6 w-6" /> },
            ].map((f) => (
              <div key={f.title} className="card p-6 animate-slide-up">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white">{f.icon}</div>
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Benefits */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-primary-700 shadow-sm">
                <GraduationCap className="h-4 w-4" /> For Students
              </div>
              <h2 className="mt-4 text-3xl font-bold text-gray-900">Track your lab journey, one program at a time</h2>
              <div className="mt-6 space-y-4">
                {[
                  'See today\'s lab tasks and deadlines at a glance',
                  'Submit programs with code, output, and explanation',
                  'Build coding streaks with GitHub-style activity calendar',
                  'Unlock quizzes by completing required programs',
                  'Auto-generate practical notebook entries',
                  'Earn badges and achievements as you progress',
                  'Track topic-wise and overall progress with charts',
                ].map((b) => (
                  <div key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-gray-700">{b}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => openAuth('student')} className="mt-8 btn-primary">
                Get Started <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Current Streak', value: '12 days', icon: <Flame className="h-8 w-8" />, color: 'from-orange-400 to-red-500' },
                { label: 'Programs Done', value: '34/50', icon: <Code2 className="h-8 w-8" />, color: 'from-primary-400 to-primary-600' },
                { label: 'Quiz Avg', value: '87%', icon: <Brain className="h-8 w-8" />, color: 'from-accent-400 to-accent-600' },
                { label: 'Badges', value: '8 earned', icon: <Award className="h-8 w-8" />, color: 'from-yellow-400 to-amber-500' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white`}>{s.icon}</div>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Benefits */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 grid grid-cols-2 gap-4 lg:order-1">
              {[
                { label: 'Active Students', value: '84', icon: <Users className="h-8 w-8" />, color: 'from-primary-400 to-primary-600' },
                { label: 'Completion', value: '72%', icon: <Target className="h-8 w-8" />, color: 'from-success-400 to-success-600' },
                { label: 'Pending', value: '23', icon: <ClipboardList className="h-8 w-8" />, color: 'from-amber-400 to-orange-500' },
                { label: 'Quiz Avg', value: '79%', icon: <Brain className="h-8 w-8" />, color: 'from-accent-400 to-accent-600' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-50 p-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white`}>{s.icon}</div>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                <Users className="h-4 w-4" /> For Teachers
              </div>
              <h2 className="mt-4 text-3xl font-bold text-gray-900">Manage labs and track every student</h2>
              <div className="mt-6 space-y-4">
                {[
                  'Create subjects, labs, topics, and programming questions',
                  'Define difficulty, language, test cases, marks, and deadlines',
                  'Verify student submissions with feedback',
                  'Create quizzes with MCQ, output, debug, and concept questions',
                  'Design custom practical notebook templates',
                  'View individual student profiles with full activity history',
                  'Track batch-level analytics and attendance eligibility',
                ].map((b) => (
                  <div key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                    <span className="text-gray-700">{b}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => openAuth('teacher')} className="mt-8 btn-secondary">
                Teacher Portal <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Practical Notebook */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-accent-300">
                <BookOpen className="h-4 w-4" /> Smart Practical Notebook
              </div>
              <h2 className="mt-4 text-3xl font-bold">Auto-generated, print-ready practical records</h2>
              <p className="mt-4 text-gray-300">
                When a program is verified as complete, LabTrack automatically creates a notebook entry draft
                with the experiment number, title, aim, theory, algorithm, your actual code, output, and viva questions.
              </p>
              <div className="mt-6 space-y-3">
                {['Auto-filled from your submission — code never modified', 'Teacher-customizable templates per lab', 'Edit, save, print, or download anytime', 'Professional print-friendly layout'].map((b) => (
                  <div key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-400" />
                    <span className="text-gray-300">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-2xl">
              <div className="border-b-2 border-gray-900 pb-3">
                <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-500">Laboratory Record</p>
                <p className="mt-1 text-center text-lg font-bold text-gray-900">Experiment No. 7 — Bubble Sort</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div><span className="font-bold">Aim:</span> Write a C program to sort an array using Bubble Sort.</div>
                <div><span className="font-bold">Theory:</span> Bubble Sort is a comparison-based sorting algorithm...</div>
                <div><span className="font-bold">Algorithm:</span> 1. Start 2. Read n elements 3. Compare adjacent...</div>
                <div className="rounded-md bg-gray-900 p-3 font-mono text-xs text-green-400">
                  <pre>{`for(i=0; i<n-1; i++) {
  for(j=0; j<n-i-1; j++) {
    if(arr[j] > arr[j+1])
      swap(&arr[j], &arr[j+1]);
  }
}`}</pre>
                </div>
                <div><span className="font-bold">Result:</span> The array was successfully sorted in ascending order.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Analytics */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-sm font-medium text-accent-700">
              <TrendingUp className="h-4 w-4" /> Progress Analytics
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">See the full picture at a glance</h2>
            <p className="mt-3 text-gray-600">Interactive charts for students and teachers</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Overall Completion', desc: 'Completed vs pending programs across all labs', icon: <Target className="h-6 w-6" /> },
              { title: 'Topic-wise Progress', desc: 'Bar charts showing per-topic completion rates', icon: <BarChart3 className="h-6 w-6" /> },
              { title: 'Quiz Score Trends', desc: 'Line charts tracking quiz performance over time', icon: <Brain className="h-6 w-6" /> },
              { title: 'Weekly Activity', desc: 'Area charts showing daily lab activity patterns', icon: <Calendar className="h-6 w-6" /> },
            ].map((c) => (
              <div key={c.title} className="card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50 text-accent-600">{c.icon}</div>
                <h3 className="mt-3 font-semibold text-gray-900">{c.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
              <HelpCircle className="h-4 w-4" /> FAQ
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="mt-10 space-y-4">
            {[
              { q: 'Does LabTrack execute code online?', a: 'No. Students write and run programs in VS Code on their own computers. LabTrack is for submitting code, output, and explanation — not for compiling code.' },
              { q: 'What is attendance eligibility?', a: 'Attendance eligibility is a LabTrack signal for manual ERP use — never a replacement for official attendance. It is calculated based on lab activity such as submissions and completions.' },
              { q: 'Is there an online compiler?', a: 'No, LabTrack does not include an online compiler. Students practice in their local development environment and submit their work for teacher verification.' },
              { q: 'Does the AI Notes feature use a paid API?', a: 'No. AI Notes uses a template-based fallback with predefined educational content. No paid AI API is required.' },
              { q: 'How do quizzes work?', a: 'Quizzes are locked until the required programs for a topic are completed. Once unlocked, students attempt MCQ, output-based, debugging, and concept questions. Scores are saved automatically.' },
              { q: 'Can the practical notebook be printed?', a: 'Yes. The notebook has a professional print-friendly layout. You can also download entries after programs are verified.' },
            ].map((item) => (
              <details key={item.q} className="group card p-5">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                  {item.q}
                  <span className="ml-4 text-gray-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 text-white">
                  <Code2 className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-white">LabTrack AI</span>
              </div>
              <p className="mt-3 max-w-sm text-sm">Practice. Progress. Prove. — A college programming-lab management and student progress tracking platform.</p>
              <p className="mt-3 text-xs text-gray-500">Attendance eligibility is a LabTrack signal for manual ERP use — never a replacement for official attendance.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Platform</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>Student Portal</li>
                <li>Teacher Portal</li>
                <li>Admin Panel</li>
                <li>Practical Notebook</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Features</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>Lab Management</li>
                <li>Progress Analytics</li>
                <li>Quiz System</li>
                <li>AI Notes</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm">
            <p>© 2026 LabTrack AI. Built for B.Tech CSE students.</p>
          </div>
        </div>
      </footer>

      <AuthModal
        open={authModal.open}
        role={authModal.role}
        onClose={() => setAuthModal({ ...authModal, open: false })}
      />
    </div>
  );
}
