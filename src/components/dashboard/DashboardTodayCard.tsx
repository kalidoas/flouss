import React, { useMemo } from 'react';
import { ArrowRight, ListChecks } from 'lucide-react';
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
  const { tasks = [], language, setActiveScreen } = useAppStore();
  const t = translations[language].dashboard;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const todayTasks = useMemo(
    () => tasks.filter((task) => appliesToday(task, today, todayKey)),
    [tasks, todayKey]
  );
  const doneCount = todayTasks.filter((task) => task.completedDates?.includes(todayKey)).length;
  const nextDirection = language === 'ar' ? 'rotate-180' : '';

  return (
    <button
      type="button"
      onClick={() => setActiveScreen('tasks')}
      className="flex min-h-12 w-full items-center gap-3 rounded-control border border-border-subtle bg-surface px-3.5 text-start text-sm text-content transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ListChecks aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
      <span className="min-w-0 flex-1 truncate font-semibold">
        {t.todayProgram}: {t.tasksDoneOf.replace('{done}', String(doneCount)).replace('{total}', String(todayTasks.length))}
      </span>
      <ArrowRight aria-hidden="true" className={`h-4 w-4 shrink-0 text-muted ${nextDirection}`} />
    </button>
  );
};
