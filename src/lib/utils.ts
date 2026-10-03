export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | null): string {
  if (!date) return 'No deadline';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date);
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'hard': return 'text-rose-600 bg-rose-50 border-rose-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'passed': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'attempted': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'not_started': return 'text-gray-500 bg-gray-50 border-gray-200';
    default: return 'text-gray-500 bg-gray-50 border-gray-200';
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'passed': return 'Passed';
    case 'attempted': return 'Attempted';
    case 'not_started': return 'Not Started';
    default: return status;
  }
}

export function calculateStreak(activityDates: string[]): { current: number; longest: number } {
  if (activityDates.length === 0) return { current: 0, longest: 0 };
  const uniqueDates = [...new Set(activityDates)].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  let longest = 0;
  let tempStreak = 1;

  for (let i = 0; i < uniqueDates.length; i++) {
    const date = new Date(uniqueDates[i]);
    date.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);

    if (date.getTime() === expected.getTime()) {
      if (i === 0) current = 1;
      else if (current > 0) current++;
    } else {
      break;
    }
  }

  const sorted = [...uniqueDates].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = Math.floor((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) tempStreak++;
      else tempStreak = 1;
    }
    if (tempStreak > longest) longest = tempStreak;
  }

  return { current, longest };
}

export function getWeekActivityMap(activityDates: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const date of activityDates) {
    map[date] = (map[date] || 0) + 1;
  }
  return map;
}
