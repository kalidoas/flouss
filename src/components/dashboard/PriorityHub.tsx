import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppleGlassCard } from '../common/AppleGlassCard';
import { translations } from '../../i18n/translations';
import { formatMAD, getCurrentMonthStr } from '../../utils/formatters';
import { islandManager } from '../../utils/islandManager';
import confetti from 'canvas-confetti';
import {
  Pin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  CreditCard,
  CheckSquare,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  HandCoins,
} from 'lucide-react';
import { NoteItem, SubscriptionItem, TaskItem, DebtItem } from '../../types';

export const PriorityHub: React.FC = () => {
  const {
    notes,
    subscriptions,
    tasks,
    debts,
    language,
    togglePinNote,
    addNoteItem,
    toggleSubscriptionPaid,
    toggleTaskCompletion,
    setActiveScreen,
    hideBalance,
  } = useAppStore();

  const tHub = translations[language].priorityHub;
  const currentMonth = useMemo(() => getCurrentMonthStr(), []);
  const today = new Date();
  const currentDay = today.getDate();
  const todayISO = today.toISOString().split('T')[0];

  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteContent, setQuickNoteContent] = useState('');

  // 1. Pinned Notes
  const pinnedNotes = useMemo(() => {
    return (notes || []).filter((n: NoteItem) => n.isPinned);
  }, [notes]);

  // 2. Urgent & Upcoming Bills / Subscriptions
  const urgentBills = useMemo(() => {
    return (subscriptions || []).filter((sub: SubscriptionItem) => {
      const isPaid = (sub.paidMonths || []).includes(currentMonth);
      if (isPaid) return false;

      // Surface if overdue this month or due within 5 days
      const daysDiff = sub.billingDay - currentDay;
      const isOverdue = currentDay > sub.billingDay;
      const isDueSoon = daysDiff >= 0 && daysDiff <= 5;
      return isOverdue || isDueSoon;
    });
  }, [subscriptions, currentMonth, currentDay]);

  // 3. Urgent / Pinned Tasks & Active Debts
  const urgentTasks = useMemo(() => {
    return (tasks || [])
      .filter((task: TaskItem) => {
        if (task.isArchived) return false;
        const isDoneToday = (task.completedDates || []).includes(todayISO);
        return !isDoneToday;
      })
      .slice(0, 3);
  }, [tasks, todayISO]);

  const activeDebts = useMemo(() => {
    return (debts || [])
      .filter((d: DebtItem) => !d.isPaid)
      .slice(0, 2);
  }, [debts]);

  const totalPriorityCount = pinnedNotes.length + urgentBills.length + urgentTasks.length;

  const handlePayBill = (sub: SubscriptionItem) => {
    toggleSubscriptionPaid(sub.id, currentMonth);

    // Confetti burst
    confetti({
      particleCount: 45,
      spread: 55,
      origin: { y: 0.7 },
    });

    // Notify Dynamic Island
    islandManager.notify({
      type: 'bill',
      title: tHub.paidSuccess,
      subtitle: `${sub.name} • ${formatMAD(sub.amount, false, language)}`,
    });
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteTitle.trim() && !quickNoteContent.trim()) return;

    const now = new Date().toISOString();
    addNoteItem({
      id: 'note_' + Date.now(),
      title: quickNoteTitle.trim() || 'Rappel urgent',
      content: quickNoteContent.trim(),
      isPinned: true,
      color: '#f59e0b',
      createdAt: now,
      updatedAt: now,
    });

    setQuickNoteTitle('');
    setQuickNoteContent('');
    setIsQuickNoteOpen(false);

    islandManager.notify({
      type: 'pin',
      title: tHub.pinnedNotes,
      subtitle: quickNoteTitle.trim() || 'Note épinglée',
    });
  };

  return (
    <AppleGlassCard className="p-5 sm:p-7 space-y-6" enableTilt={false}>
      {/* Top Header of the Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.05] dark:border-white/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 font-bold">
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                {tHub.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums">
                {totalPriorityCount}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {tHub.subtitle}
            </p>
          </div>
        </div>

        {/* Quick Pin Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickNoteOpen(!isQuickNoteOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{tHub.pinUrgentItem}</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Note Creation Drawer */}
      <AnimatePresence>
        {isQuickNoteOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddQuickNote}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 fill-current" />
                <span>{tHub.quickNewNote}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsQuickNoteOpen(false)}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
              >
                Annuler
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={quickNoteTitle}
              onChange={(e) => setQuickNoteTitle(e.target.value)}
              placeholder="Titre du rappel..."
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-amber-500/30 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
            />

            <textarea
              rows={2}
              value={quickNoteContent}
              onChange={(e) => setQuickNoteContent(e.target.value)}
              placeholder={tHub.notePlaceholder}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-amber-500/30 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                {tHub.pinNoteAction}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Sections: Pinned Notes + Urgent Bills + Active Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. PINNED STICKY NOTES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{tHub.pinnedNotes}</span>
              <span className="tabular-nums opacity-75">({pinnedNotes.length})</span>
            </span>

            <button
              onClick={() => setActiveScreen('notes')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Voir tout</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {pinnedNotes.length === 0 ? (
            <div
              onClick={() => setIsQuickNoteOpen(true)}
              className="cursor-pointer p-4 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] hover:border-amber-500/40 text-center space-y-1 transition-colors"
            >
              <Pin className="w-4 h-4 mx-auto text-zinc-400 opacity-60" />
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {tHub.noPinnedNotes}
              </div>
              <div className="text-[11px] text-zinc-400">
                {tHub.addNotePrompt}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pinnedNotes.map((note: NoteItem) => (
                <motion.div
                  key={note.id}
                  layoutId={`card-${note.id}`}
                  whileHover={{ y: -2 }}
                  className="group relative p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 hover:border-amber-500/35 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-amber-950 dark:text-amber-200 tracking-tight truncate">
                        {note.title}
                      </span>
                      <button
                        onClick={() => togglePinNote(note.id)}
                        className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                        title={tHub.unpinAction}
                      >
                        <Pin className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                    <p className="text-xs text-amber-900/80 dark:text-amber-200/70 line-clamp-3 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 2. URGENT & UPCOMING BILLS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-purple-500" />
              <span>{tHub.urgentBills}</span>
              <span className="tabular-nums opacity-75">({urgentBills.length})</span>
            </span>

            <button
              onClick={() => setActiveScreen('subscriptions')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Gérer</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {urgentBills.length === 0 ? (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.06] text-center space-y-1">
              <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {tHub.noUrgentBills}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {urgentBills.map((sub: SubscriptionItem) => {
                const daysDiff = sub.billingDay - currentDay;
                const isOverdue = currentDay > sub.billingDay;
                const isDueToday = daysDiff === 0;

                return (
                  <motion.div
                    key={sub.id}
                    layoutId={`card-${sub.id}`}
                    whileHover={{ y: -1 }}
                    className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/65 border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white tracking-tight truncate">
                          {sub.name}
                        </span>
                        {/* Urgency Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOverdue
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 animate-pulse'
                              : isDueToday
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {isOverdue
                            ? tHub.overdue
                            : isDueToday
                            ? tHub.dueToday
                            : tHub.dueInDays.replace('{days}', String(daysDiff))}
                        </span>
                      </div>

                      <div
                        className={`text-xs font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight ${
                          hideBalance ? 'privacy-blur' : ''
                        }`}
                      >
                        {formatMAD(sub.amount, false, language)}
                      </div>
                    </div>

                    {/* 1-Click Pay Now Spring Button */}
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handlePayBill(sub)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tHub.payNow}</span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. PINNED ROUTINES & TASKS STRIP */}
      {urgentTasks.length > 0 && (
        <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <CheckSquare className="w-3 h-3 text-blue-500" />
              <span>{tHub.pinnedTasks}</span>
            </span>

            <button
              onClick={() => setActiveScreen('tasks')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Programme</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {urgentTasks.map((task: TaskItem) => (
              <div
                key={task.id}
                onClick={() => toggleTaskCompletion(task.id, todayISO)}
                className="cursor-pointer p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2 transition-all"
              >
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {task.title}
                </span>
                <span className="w-4 h-4 rounded-md border border-zinc-300 dark:border-zinc-600 flex items-center justify-center shrink-0">
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppleGlassCard>
  );
};
