import React, { useMemo } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Card } from '../common/Card';
import { useAppStore } from '../../store/useAppStore';
import { TaskItem } from '../../types';
import { translations } from '../../i18n/translations';

function appliesToday(task: TaskItem, day: Date, todayKey: string) {
  if (task.isArchived) return false;
  if (task.targetMonth && task.targetMonth !== todayKey.slice(0, 7)) return false;
  if (task.scheduledDate && task.scheduledDate !== todayKey) return false;
  const dayOfWeek = day.getDay();
  if (task.frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) return false;
  if (task.frequency === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) return false;
  if (task.frequency === 'custom_days' && !task.selectedDaysOfWeek?.includes(dayOfWeek)) return false;
  return true;
}

export const DashboardTodayCard: React.FC = () => {
  const { tasks = [], toggleTaskDone, showToast, language, setActiveScreen } = useAppStore();
  const t = translations[language].dashboard;
  const common = translations[language].common;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayTasks = useMemo(() => tasks.filter((task) => appliesToday(task, today, todayKey)), [tasks, todayKey]);
  const doneCount = todayTasks.filter((task) => task.completedDates?.includes(todayKey)).length;
  const pending = todayTasks.filter((task) => !task.completedDates?.includes(todayKey))
    .sort((a, b) => Number(b.frequency === 'daily') - Number(a.frequency === 'daily'))
    .slice(0, 3);
  const progress = todayTasks.length ? Math.round((doneCount / todayTasks.length) * 100) : 0;
  const toggleWithUndo = (task: TaskItem) => {
    toggleTaskDone(task.id, todayKey);
    showToast({ message: t.taskCompleted, actionText: common.undo, onAction: () => toggleTaskDone(task.id, todayKey) });
  };

  return (
    <Card padding="md" className="flex min-h-[190px] flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-content">{t.todayProgram}</h2>
          <p className="mt-1 text-xs text-muted">{t.tasksDoneOf.replace('{done}', String(doneCount)).replace('{total}', String(todayTasks.length))}</p>
        </div>
        <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full" role="img" aria-label={`${t.todayProgress} · ${progress}%`} style={{ background: `conic-gradient(#0A84FF ${progress}%, rgba(255,255,255,.08) 0)` }}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-xs font-semibold tabular-nums text-content">{progress}%</span>
        </div>
      </div>
      {pending.length ? <div className="flex flex-wrap gap-2">
        {pending.map((task) => <button key={task.id} type="button" onClick={() => toggleWithUndo(task)} title={task.title} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border-subtle bg-surface-raised px-3 text-xs font-medium text-content transition hover:border-positive/40 hover:bg-positive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="truncate">{task.title}</span><Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-positive" />
        </button>)}
      </div> : <p className="text-xs text-muted">{t.noProgramTasksToday}</p>}
      <button type="button" onClick={() => setActiveScreen('tasks')} className="inline-flex min-h-11 items-center gap-1 self-start rounded-control px-2 text-xs font-semibold text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        {t.openProgram}<ArrowRight aria-hidden="true" className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
      </button>
    </Card>
  );
};
