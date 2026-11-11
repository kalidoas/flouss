import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Plus, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { FocusTask } from '../../types';
import { translations } from '../../i18n/translations';
import { getIntlLocale } from '../../utils/formatters';
import { getOpenFocusTasks } from '../../utils/dashboard';

export const DashboardFocusNow: React.FC = () => {
  const { focusTasks = [], addFocusTask, toggleFocusTask, showToast, language, setActiveScreen } = useAppStore();
  const t = translations[language].dashboard;
  const common = translations[language].common;
  const [formOpen, setFormOpen] = useState(false);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [urgent, setUrgent] = useState(false);
  const today = new Date();
  const tasks = useMemo(() => getOpenFocusTasks(focusTasks, today), [focusTasks, today.toDateString()]);
  if (!tasks.length && !formOpen) return null;

  const dateLabel = (date: string) => new Intl.DateTimeFormat(getIntlLocale(language), { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`));
  const finishTask = (task: FocusTask) => {
    toggleFocusTask(task.id);
    showToast({
      message: t.taskCompleted,
      actionText: common.undo,
      onAction: () => toggleFocusTask(task.id),
    });
  };
  const createTask = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const task: FocusTask = {
      id: `focus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      listId: 'default',
      text: trimmed,
      completed: false,
      isPinned: false,
      priority: urgent ? 'urgent' : 'normal',
      ...(dueDate ? { dueDate } : {}),
      createdAt: new Date().toISOString(),
    };
    addFocusTask(task);
    setText('');
    setDueDate('');
    setUrgent(false);
    setFormOpen(false);
  };

  return (
    <section
      aria-labelledby="dashboard-focus-title"
      data-spotlight="true"
      className="spotlight-card rounded-2xl bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden break-inside-avoid mb-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 70% 60% at 100% 0%, rgba(244,63,94,0.12), transparent 70%)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-rose-400" />
          <h2 id="dashboard-focus-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">{t.focusNow}</h2>
          <span className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose-300">{tasks.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1 text-xs font-medium text-zinc-200 transition-all"><Plus className="h-3 w-3" /><span>{t.addFocusTask}</span></button>
          <button type="button" onClick={() => setActiveScreen('tasks')} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white transition-all">{t.allTasks}<ArrowRight aria-hidden="true" className={`h-3 w-3 ${language === 'ar' ? 'rotate-180' : ''}`} /></button>
        </div>
      </div>

      {formOpen && (
        <form onSubmit={createTask} className="mb-3 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5">
          {/* Row 1: Task Title */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-zinc-300">
              {t.focusTaskTitle}
            </label>
            <input
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={120}
              placeholder={t.focusTaskTitle}
              className="min-h-9 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          {/* Row 2: Date & Priority & Submit */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-zinc-300">
                {t.dueDate}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="min-h-9 w-full min-w-[140px] rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <button
                type="button"
                aria-pressed={urgent}
                onClick={() => setUrgent((value) => !value)}
                className={`min-h-9 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                  urgent
                    ? 'border-rose-400/40 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {t.urgentPriority}
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="min-h-9 rounded-full bg-white text-zinc-950 font-semibold px-5 text-xs disabled:opacity-40 hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
              >
                {common.save}
              </button>
            </div>
          </div>
        </form>
      )}

      <ul className="space-y-2" aria-label={t.focusNow}>
        {tasks.slice(0, 3).map((task) => {
          const overdue = Boolean(task.dueDate && task.dueDate < `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
          return <li key={task.id} className="flex min-h-11 min-w-0 items-center gap-2.5 py-2.5 px-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all">
            <button type="button" onClick={() => finishTask(task)} aria-label={`${common.doneToday}: ${task.text}`} className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 hover:border-emerald-400 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><Check className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200" title={task.text}>{task.text}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                {task.priority === 'urgent' && <span className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2 py-0.2 font-semibold text-rose-300">{t.urgentPriority}</span>}
                {task.dueDate && <span className={overdue ? 'font-semibold text-rose-400' : 'text-zinc-400'}><CalendarDays className="me-1 inline h-3 w-3" />{overdue ? t.overdueDate.replace('{date}', dateLabel(task.dueDate)) : dateLabel(task.dueDate)}</span>}
              </div>
            </div>
          </li>;
        })}
        {tasks.length > 3 && <li className="px-2 text-[11px] font-medium text-zinc-400">{t.moreCount.replace('{count}', String(tasks.length - 3))}</li>}
      </ul>
    </section>
  );
};
