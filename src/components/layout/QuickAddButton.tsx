import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, ArrowDownRight, ArrowUpRight, Target } from 'lucide-react';
import { AddExpenseModal } from '../transactions/AddExpenseModal';
import { AddIncomeModal } from '../transactions/AddIncomeModal';
import { AddContributionModal } from '../transactions/AddContributionModal';
import { translations } from '../../i18n/translations';

export const QuickAddButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const { language } = useAppStore();
  const t = translations[language].common;

  return (
    <>
      <div className="hidden md:block fixed bottom-6 end-6 z-40">
        {/* Floating Actions Menu */}
        {isOpen && (
          <div className="mb-2 space-y-1.5 bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] rounded-xl shadow-xl p-1.5 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsExpenseOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-start"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{t.addExpense}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsIncomeOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-start"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{t.addIncome}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsContributionOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-start"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{t.addContribution}</span>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={`${isOpen ? t.closeMenu : t.quickAdd} (+)`}
          className={`w-11 h-11 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white shadow-lg flex items-center justify-center transition-all duration-150 ${
            isOpen ? 'rotate-45' : 'hover:scale-105 active:scale-95'
          }`}
          aria-label={t.quickAdd}
        >
          <Plus className="w-5 h-5 stroke-[2.4]" />
        </button>
      </div>

      <AddExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <AddIncomeModal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} />
      <AddContributionModal isOpen={isContributionOpen} onClose={() => setIsContributionOpen(false)} />
    </>
  );
};
