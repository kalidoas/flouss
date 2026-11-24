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
  const [isOpen, setIsOpen] = useState<boolean>(false);
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
    <div className="pointer-events-auto">
      {/* Safe-area-aware Quick Add */}
      <div className="fixed bottom-[env(safe-area-inset-bottom,12px)] end-6 z-[9999] flex items-center gap-2 rounded-full bg-surface border border-border-subtle p-2 shadow-xs backdrop-blur-sm select-none pointer-events-auto">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={tCommon.quickAdd}
          title={tCommon.quickAdd}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-surface-raised hover:bg-surface-raised/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
        >
          <Plus className="h-4 w-4 text-content transition-transform duration-200" />
        </button>
        <div className="hidden sm:block w-28 rounded-[12px] bg-surface border border-border-subtle p-3 shadow-xs backdrop-blur-md select-none pointer-events-auto mt-3 animate-in fade-in-0">
          <button
            type="button"
            onClick={() => handleAction(() => onAddExpense?.() || window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'expense' } })))}
            className="w-full flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-positive dark:text-positive transition-all active:scale-95 duration-150 group cursor-pointer mb-2"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{tCommon.addExpense}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAction(() => onAddIncome?.() || window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'income' } })))}
            className="w-full flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-positive dark:text-positive transition-all active:scale-95 duration-150 group cursor-pointer mb-2"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{tCommon.addIncome}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAction(() => onAddContribution?.() || window.dispatchEvent(new CustomEvent('flouss:open-contribution')))}
            className="w-full flex items-center gap-2.5 rounded-2xl bg-surface-raised/60 border border-border-subtle px-2.5 py-1.5 text-xs font-semibold text-content dark:text-muted transition-all active:scale-95 duration-150 group cursor-pointer mb-2"
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>{tCommon.addContribution}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
