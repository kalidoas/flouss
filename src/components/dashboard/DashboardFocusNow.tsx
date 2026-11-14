import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Plus, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { FocusTask } from '../../types';
import { translations } from '../../i18n/translations';
import { getIntlLocale } from '../../utils/formatters';
import { getOpenFocusTasks } from '../../utils/dashboard';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { playHapticFeedback } from '../../utils/haptics';

export const DashboardFocusNow: React.FC = () => {
  const { focusTasks = [], addFocusTask, toggleFocusTask, showToast, language, setActiveScreen } = useAppStore();
  const t = translations[language].dashboard;
  const common = translations[language].common;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [urgent, setUrgent] = useState(false);
  const today = new Date();
  const tasks = useMemo(() => getOpenFocusTasks(focusTasks, today), [focusTasks, today.toDateString()]);

  if (!tasks.length && !isModalOpen) return null;

  const dateLabel = (date: string) =>
    new Intl.DateTimeFormat(getIntlLocale(language), { day: 'numeric', month: 'short' }).format(
      new Date(`${date}T12:00:00`)
    );

  const finishTask = (task: FocusTask) => {
    toggleFocusTask(task.id);
    showToast({
      message: t.taskCompleted,
      actionText: common.undo,
      onAction: () => toggleFocusTask(task.id),
    });
  };

  const handleOpenModal = () => {
    playHapticFeedback('light');
    setText('');
    setDueDate('');
    setUrgent(false);
    setIsModalOpen(true);
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
      ...(dueDate ? { dueDate: dueDate.slice(0, 10) } : {}),
      createdAt: new Date().toISOString(),
    };
    addFocusTask(task);
    setText('');
    setDueDate('');
    setUrgent(false);
    setIsModalOpen(false);
  };

  return (
    <>
      <section
        aria-labelledby="dashboard-focus-title"
        data-spotlight="true"
        className="spotlight-card rounded-2xl bg-surface text-content dark:bg-white/5 dark:text-white p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-white/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden break-inside-avoid mb-4 min-w-0"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 60% at 100% 0%, rgba(244,63,94,0.12), transparent 70%)' }}
      >
        <div className="flex items-center justify-between gap-2 mb-3 min-w-0 flex-wrap">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <h2 id="dashboard-focus-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted dark:text-zinc-300">
              {t.focusNow}
            </h2>
            <span className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose-600 dark:text-rose-300">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-surface-raised border border-border-subtle hover:bg-surface px-2.5 py-1 text-xs font-medium text-content dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.08] dark:text-zinc-200 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.addFocusTask}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('tasks')}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-surface-raised border border-border-subtle hover:bg-surface px-2.5 py-1 text-xs font-medium text-muted hover:text-content dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.08] dark:text-zinc-300 dark:hover:text-white transition-all cursor-pointer"
            >
              {t.allTasks}
              <ArrowRight aria-hidden="true" className={`h-3 w-3 rtl:rotate-180`} />
            </button>
          </div>
        </div>

        {/* Task List */}
        <ul className="space-y-2 min-w-0" aria-label={t.focusNow}>
          {tasks.slice(0, 3).map((task) => {
            const overdue = Boolean(
              task.dueDate &&
                task.dueDate <
                  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
                    today.getDate()
                  ).padStart(2, '0')}`
            );
            return (
              <li
                key={task.id}
                className="flex min-h-11 min-w-0 items-center gap-2.5 py-2.5 px-3.5 rounded-2xl bg-surface-raised/60 border border-border-subtle hover:bg-surface-raised dark:bg-white/[0.03] dark:border-white/[0.05] dark:hover:bg-white/[0.05] transition-all"
              >
                <button
                  type="button"
                  onClick={() => finishTask(task)}
                  aria-label={`${common.doneToday}: ${task.text}`}
                  className="group flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-border-subtle dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-500/10 text-muted hover:text-emerald-500 transition-all cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-content dark:text-zinc-200" title={task.text}>
                    {task.text}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                    {task.priority === 'urgent' && (
                      <span className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2 py-0.2 font-semibold text-rose-600 dark:text-rose-300">
                        {t.urgentPriority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={overdue ? 'font-semibold text-rose-500 dark:text-rose-400' : 'text-muted'}>
                        <CalendarDays className="me-1 inline h-3 w-3" />
                        {overdue ? t.overdueDate.replace('{date}', dateLabel(task.dueDate)) : dateLabel(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {tasks.length > 3 && (
            <li className="px-2 text-[11px] font-medium text-muted">
              {t.moreCount.replace('{count}', String(tasks.length - 3))}
            </li>
          )}
        </ul>
      </section>

      {/* Focus Task Add Modal (Replaces inline form) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t.addFocusTask}
        maxWidth="sm"
      >
        <form onSubmit={createTask} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-content dark:text-zinc-300">
              {t.focusTaskTitle}
            </label>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
              placeholder={t.focusTaskTitle}
              className="min-h-11 w-full rounded-xl border border-border-subtle bg-surface text-content dark:border-white/10 dark:bg-zinc-900 dark:text-white px-3.5 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <CustomDatePicker
              label={t.dueDate}
              value={dueDate}
              onChange={(d) => setDueDate(d)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              aria-pressed={urgent}
              onClick={() => setUrgent((value) => !value)}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                urgent
                  ? 'border-rose-400/40 bg-rose-500/20 text-rose-500 dark:text-rose-300 shadow-sm'
                  : 'border-border-subtle bg-surface text-muted hover:text-content dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {t.urgentPriority}
            </button>

            <Button
              type="submit"
              disabled={!text.trim()}
              variant="primary"
              className="min-h-[44px] px-6"
            >
              {common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
