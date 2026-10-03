import { cn } from '@/lib/utils';

interface ActivityCalendarProps {
  activityMap: Record<string, number>;
  weeks?: number;
}

export function ActivityCalendar({ activityMap, weeks = 26 }: ActivityCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: { date: string; count: number }[] = [];
  const totalDays = weeks * 7;
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - totalDays + 1);
  // Align to Sunday
  const startDayOfWeek = startDay.getDay();
  startDay.setDate(startDay.getDate() - startDayOfWeek);

  for (let i = 0; i < totalDays + 7; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    if (d > today) break;
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: activityMap[dateStr] || 0 });
  }

  const weekCols: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weekCols.push(days.slice(i, i + 7));
  }

  const levelColors = [
    'bg-gray-100',
    'bg-success-200',
    'bg-success-300',
    'bg-success-500',
    'bg-success-700',
  ];

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="mb-1 flex gap-1 pl-8">
          {weekCols.map((week, i) => {
            const firstDay = new Date(week[0]?.date);
            if (firstDay.getDate() <= 7 && i % 4 === 0) {
              return <div key={i} className="w-2.5 text-[10px] text-gray-400" style={{ minWidth: '30px' }}>{monthLabels[firstDay.getMonth()]}</div>;
            }
            return <div key={i} className="w-2.5" style={{ minWidth: '30px' }} />;
          })}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 pr-1">
            {['Mon', 'Wed', 'Fri'].map((d) => (
              <div key={d} className="h-2.5 text-[10px] text-gray-400 flex items-center" style={{ height: '12px' }}>{d}</div>
            ))}
          </div>
          {weekCols.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                if (!day) return <div key={Math.random()} className="h-2.5 w-2.5" />;
                const level = getLevel(day.count);
                return (
                  <div
                    key={day.date}
                    className={cn('h-2.5 w-2.5 rounded-sm transition-transform hover:scale-125', levelColors[level])}
                    title={`${day.date}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-gray-400">Less</span>
          {levelColors.map((c, i) => (
            <div key={i} className={cn('h-2.5 w-2.5 rounded-sm', c)} />
          ))}
          <span className="text-[10px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}
