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
    <div
      data-spotlight="true"
      className="spotlight-card flex flex-col justify-between gap-3.5 rounded-2xl bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(99,102,241,0.1), transparent 70%)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">{t.todayProgram}</p>
          <p className="mt-1 text-xs text-zinc-300 font-medium">{t.tasksDoneOf.replace('{done}', String(doneCount)).replace('{total}', String(todayTasks.length))}</p>
        </div>
        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full" role="img" aria-label={`${t.todayProgress} · ${progress}%`} style={{ background: `conic-gradient(#6366F1 ${progress}%, rgba(255,255,255,.07) 0)` }}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs font-bold tabular-nums text-white">{progress}%</span>
        </div>
      </div>
      {pending.length ? <div className="space-y-1.5">
        {pending.map((task) => <button key={task.id} type="button" onClick={() => toggleWithUndo(task)} title={task.title} className="flex w-full items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-emerald-500/10 hover:border-emerald-500/20 text-xs font-medium text-zinc-200 transition-all group">
          <span className="truncate">{task.title}</span>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 group-hover:border-emerald-400 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-300 transition-all"><Check aria-hidden="true" className="h-3 w-3" /></span>
        </button>)}
      </div> : <p className="text-xs text-zinc-400">{t.noProgramTasksToday}</p>}
      <button type="button" onClick={() => setActiveScreen('tasks')} className="inline-flex min-h-8 items-center gap-1 self-start rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1 text-xs font-medium text-indigo-300 hover:text-white transition-all">
        <span>{t.openProgram}</span><ArrowRight aria-hidden="true" className={`h-3 w-3 ${language === 'ar' ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
