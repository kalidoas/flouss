import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingDown, TrendingUp, PiggyBank, CheckSquare, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { triggerHaptic } from '../../utils/haptics';

interface QuickAddButtonProps {
  onClick?: () => void;
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onAddContribution?: () => void;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({
  onClick,
  onAddExpense,
  onAddIncome,
  onAddContribution,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(() => typeof document !== 'undefined');
  const { language, setActiveScreen } = useAppStore();
  const tCommon = translations[language].common;
  const tNav = translations[language].nav;
  const tTasks = translations[language].tasks;
  const tNotes = translations[language].notes;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key listener to close menu
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic(40);
    setIsOpen((prev) => !prev);
  };

  const handleAction = (callback?: () => void) => {
    triggerHaptic(50);
    setIsOpen(false);
    if (callback) {
      callback();
    } else if (onClick) {
      onClick();
    }
  };

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="hidden md:block pointer-events-auto">
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={tCommon.quickAdd}
        title={tCommon.quickAdd}
        className={`fixed bottom-6 end-6 z-[9999] h-14 w-14 items-center justify-center rounded-full flex outline-none transition-all duration-300 cursor-pointer pointer-events-auto select-none ${
          isOpen
            ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_0_28px_rgba(99,102,241,0.65)] rotate-45 scale-105'
            : 'bg-white text-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.5),0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95'
        }`}
      >
        <Plus className="h-6 w-6 stroke-[2.5] transition-transform duration-300" />
      </button>

      {/* Action Menu Rendered via Root DOM Portal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Fullscreen click-outside invisible backdrop */}
            <div
              aria-hidden="true"
              className="fixed inset-0 z-[9998] cursor-default bg-black/40 backdrop-blur-xs transition-opacity pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Floating Action Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="fixed bottom-24 end-6 z-[9999] w-72 rounded-[24px] bg-[#0D0E14]/95 backdrop-blur-2xl border border-white/10 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] select-none pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                {/* Action 1: Add Expense */}
                <button
                  type="button"
                  onClick={() =>
                    handleAction(() => {
                      if (onAddExpense) {
                        onAddExpense();
                      } else {
                        window.dispatchEvent(
                          new CustomEvent('flouss:quick-add', { detail: { type: 'expense' } })
                        );
                      }
                    })
                  }
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingDown className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-rose-300 truncate">
                      {tCommon.addExpense}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'مصروف جديد' : language === 'en' ? 'New expense' : 'Nouvelle dépense'}
                    </span>
                  </div>
                </button>

                {/* Action 2: Add Income */}
                <button
                  type="button"
                  onClick={() =>
                    handleAction(() => {
                      if (onAddIncome) {
                        onAddIncome();
                      } else {
                        window.dispatchEvent(
                          new CustomEvent('flouss:quick-add', { detail: { type: 'income' } })
                        );
                      }
                    })
                  }
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-500/15 border border-transparent hover:border-emerald-500/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-emerald-300 truncate">
                      {tCommon.addIncome}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'دخل أو إيداع' : language === 'en' ? 'New income' : 'Entrée de fonds'}
                    </span>
                  </div>
                </button>

                {/* Action 3: Add Contribution */}
                <button
                  type="button"
                  onClick={() =>
                    handleAction(() => {
                      if (onAddContribution) {
                        onAddContribution();
                      } else {
                        window.dispatchEvent(new CustomEvent('flouss:open-contribution'));
                      }
                    })
                  }
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-blue-500/15 border border-transparent hover:border-blue-500/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PiggyBank className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-blue-300 truncate">
                      {tCommon.addContribution}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {tNav.contributionDesc}
                    </span>
                  </div>
                </button>

                {/* Action 4: New Task */}
                <button
                  type="button"
                  onClick={() =>
                    handleAction(() => {
                      setActiveScreen('tasks');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('flouss:open-add-task'));
                      }, 60);
                    })
                  }
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-indigo-300 truncate">
                      {tTasks.addTask}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'مهمة أو عادة' : language === 'en' ? 'Task or habit' : 'Tâche ou habitude'}
                    </span>
                  </div>
                </button>

                {/* Action 5: New Note */}
                <button
                  type="button"
                  onClick={() =>
                    handleAction(() => {
                      setActiveScreen('notes');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('flouss:open-add-note'));
                      }, 60);
                    })
                  }
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-amber-500/15 border border-transparent hover:border-amber-500/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-amber-300 truncate">
                      {tNotes.newNote}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'فكرة أو قائمة' : language === 'en' ? 'Idea or memo' : 'Idée ou mémo'}
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};
