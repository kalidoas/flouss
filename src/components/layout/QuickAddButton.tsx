import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(() => typeof document !== 'undefined');
  const { language } = useAppStore();
  const tCommon = translations[language].common;

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
    <div className="pointer-events-auto">
      {/* FAB toggle with z-[9999] */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={tCommon.quickAdd}
        title={tCommon.quickAdd}
        className={`fixed bottom-6 end-6 z-[9999] h-14 w-14 items-center justify-center rounded-full flex outline-none transition-all duration-300 cursor-pointer pointer-events-auto select-none ${
          isOpen
            ? 'bg-accent rotate-45 scale-105 shadow-md'
            : 'bg-surface text-content shadow-md dark:bg-surface-3 dark:text-text-subtle hover:shadow-lg active:scale-95'
        }`}
      >
        <Plus className="h-6 w-6 stroke-[2.5] transition-transform duration-300" />
      </button>

      {/* Action Menu Rendered via Root DOM Portal */}
      <AnimatePresence>
        {isOpen && (
          <>
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
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-surface-raised border border-transparent hover:border-border/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-negative/15 text-negative border border-negative/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingDown className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-content truncate">
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
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-surface-raised border border-transparent hover:border-border/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-positive/15 text-positive border border-positive/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-content truncate">
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
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-surface-raised border border-transparent hover:border-border/30 text-start transition-all active:scale-98 duration-150 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent border border-accent/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PiggyBank className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-content truncate">
                      {tCommon.addContribution}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {tCommon.savingFor}
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