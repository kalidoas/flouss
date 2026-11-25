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
  const {
    focusTasks = [],
    addFocusTask,
    toggleFocusTask,
    showToast,
    language,
    setActiveScreen,
  } = useAppStore();
  const t = translations[language].dashboard;
  const common = translations[language].common;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [urgent, setUrgent] = useState(false);
  const today = new Date();
  const tasks = useMemo(
    () => getOpenFocusTasks(focusTasks, today),
    [focusTasks, today.toDateString()]
  );

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
        className="spotlight-card rounded-2xl bg-surface text-content dark:bg-surface-3/5 text-content p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-border-subtle/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden h-fit min-w-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 60% at 100% 0%, rgba(244,63,94,0.12), transparent 70%)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400"
            />
            <h2
              id="dashboard-focus-title"
              className="text-[15px] sm:text-base font-semibold text-content text-content truncate"
            >
              {t.focusNow}
            </h2>
            {tasks.length > 0 && (
              <span className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose-600 dark:text-rose-300 shrink-0">
                {tasks.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-surface-raised border border-border-subtle hover:bg-surface px-2.5 py-1 text-xs font-semibold text-content dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.08] dark:text-zinc-200 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.addFocusTask}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('tasks')}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-surface-raised border border-border-subtle hover:bg-surface px-2.5 py-1 text-xs font-semibold text-muted hover:text-content dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.08] dark:text-zinc-300 dark:hover:text-white transition-all cursor-pointer"
            >
              <span>{t.allTasks}</span>
              <ArrowRight aria-hidden="true" className="h-3 w-3 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Task List */}
        {tasks.length > 0 ? (
          <ul className="space-y-2 min-w-0" aria-label={t.focusNow}>
            {tasks.slice(0, 3).map((task) => {
              const overdue = Boolean(
                task.dueDate &&
                  task.dueDate <
                    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
                      2,
                      '0'
                    )}-${String(today.getDate()).padStart(2, '0')}`
              );
              return (
                <li
                  key={task.id}
                  className="flex min-h-11 min-w-0 items-center gap-2.5 py-2 px-3 rounded-xl bg-surface-raised/60 dark:bg-white/[0.03] border border-border-subtle dark:border-white/[0.05] hover:bg-surface-raised dark:hover:bg-white/[0.05] transition-all"
                >
                  <button
                    type="button"
                    onClick={() => finishTask(task)}
                    aria-label={`${common.doneToday}: ${task.text}`}
                    className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-subtle dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-500/10 text-muted hover:text-emerald-500 transition-all cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                    <p
                      className="truncate text-xs sm:text-[13px] font-medium text-content dark:text-zinc-200"
                      title={task.text}
                    >
                      {task.text}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      {task.priority === 'urgent' && (
                        <span className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-300 shrink-0 whitespace-nowrap">
                          {t.urgentPriority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={`text-[11px] shrink-0 whitespace-nowrap ${
                            overdue
                              ? 'font-semibold text-rose-600 dark:text-rose-400'
                              : 'text-muted text-muted'
                          }`}
                        >
                          <CalendarDays className="me-1 inline h-3 w-3" />
                          {overdue
                            ? t.overdueDate.replace('{date}', dateLabel(task.dueDate))
                            : dateLabel(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {tasks.length > 3 && (
              <li className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setActiveScreen('tasks')}
                  className="text-xs font-semibold text-muted hover:text-content dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t.moreCount.replace('{count}', String(tasks.length - 3))}
                </button>
              </li>
            )}
          </ul>
        ) : (
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle dark:border-border-subtle/10 text-xs font-semibold text-muted hover:text-content hover:border-rose-400/50 hover:bg-rose-500/[0.03] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.addFocusTask}</span>
          </button>
        )}
      </section>

      {/* Focus Task Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t.addFocusTask}
        maxWidth="sm"
      >
        <form onSubmit={createTask} className="flex flex-col gap-4 p-4">
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
              className="min-h-11 w-full rounded-xl border border-border-subtle bg-surface text-content dark:border-border-subtle/10 dark:bg-zinc-900 text-content px-3.5 py-2 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                  : 'border-border-subtle bg-surface text-muted hover:text-content dark:border-white/[0.08] dark:bg-white/[0.04] text-muted dark:hover:text-white'
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
