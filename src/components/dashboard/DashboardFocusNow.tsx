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
    <section aria-labelledby="dashboard-focus-title" className="rounded-card border border-rose-400/25 bg-rose-500/[0.035] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-rose-300" />
          <h2 id="dashboard-focus-title" className="text-sm font-semibold text-content">{t.focusNow}</h2>
          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-rose-300">{tasks.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-xs font-semibold text-content hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Plus className="h-3.5 w-3.5" />{t.addFocusTask}</button>
          <button type="button" onClick={() => setActiveScreen('tasks')} className="inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-xs font-semibold text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t.allTasks}<ArrowRight aria-hidden="true" className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} /></button>
        </div>
      </div>

      {formOpen && <form onSubmit={createTask} className="mt-3 grid gap-2 rounded-control border border-border-subtle bg-surface p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <label className="min-w-0 space-y-1 text-xs text-muted">{t.focusTaskTitle}<input autoFocus value={text} onChange={(event) => setText(event.target.value)} maxLength={120} className="min-h-11 w-full rounded-control border border-border-subtle bg-canvas px-3 text-sm text-content outline-none focus-visible:ring-2 focus-visible:ring-accent" /></label>
        <label className="space-y-1 text-xs text-muted">{t.dueDate}<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="min-h-11 w-full rounded-control border border-border-subtle bg-canvas px-3 text-sm text-content outline-none focus-visible:ring-2 focus-visible:ring-accent" /></label>
        <button type="button" aria-pressed={urgent} onClick={() => setUrgent((value) => !value)} className={`min-h-11 rounded-control border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${urgent ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-border-subtle text-muted'}`}>{t.urgentPriority}</button>
        <button type="submit" disabled={!text.trim()} className="min-h-11 rounded-control bg-accent px-4 text-xs font-semibold text-white disabled:opacity-50">{common.save}</button>
      </form>}

      <ul className="mt-3 grid gap-2 md:grid-cols-2" aria-label={t.focusNow}>
        {tasks.slice(0, 3).map((task) => {
          const overdue = Boolean(task.dueDate && task.dueDate < `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
          return <li key={task.id} className="flex min-h-12 min-w-0 items-center gap-2 rounded-control border border-border-subtle bg-surface px-3 py-2">
            <button type="button" onClick={() => finishTask(task)} aria-label={`${common.doneToday}: ${task.text}`} className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-positive/10 hover:text-positive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-current"><Check className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></span></button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-content" title={task.text}>{task.text}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                {task.priority === 'urgent' && <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 font-medium text-rose-300">{t.urgentPriority}</span>}
                {task.dueDate && <span className={overdue ? 'font-medium text-rose-300' : ''}><CalendarDays className="me-1 inline h-3 w-3" />{overdue ? t.overdueDate.replace('{date}', dateLabel(task.dueDate)) : dateLabel(task.dueDate)}</span>}
              </div>
            </div>
          </li>;
        })}
        {tasks.length > 3 && <li className="flex min-h-12 items-center px-3 text-xs font-medium text-muted md:col-span-2">{t.moreCount.replace('{count}', String(tasks.length - 3))}</li>}
      </ul>
    </section>
  );
};
