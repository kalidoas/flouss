import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, ArrowDownRight, ArrowUpRight, Target } from 'lucide-react';
import { AddExpenseModal } from '../transactions/AddExpenseModal';
import { AddIncomeModal } from '../transactions/AddIncomeModal';
import { AddContributionModal } from '../transactions/AddContributionModal';

export const QuickAddButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const { language } = useAppStore();
  const isAr = language === 'ar';

  return (
    <>
      <div className="hidden md:block fixed bottom-5 right-4 z-40">
        {/* Floating Actions Menu */}
        {isOpen && (
          <div className="mb-2 space-y-1.5 bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] rounded-lg shadow-lg p-1.5 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsExpenseOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-600 dark:text-rose-400 hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors text-left"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل مصاريف' : 'Dépense'}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsIncomeOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-emerald-600 dark:text-emerald-400 hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors text-left"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل مدخول' : 'Revenu'}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsContributionOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[#2383e2] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors text-left"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isAr ? 'تغذية هدف' : 'Épargne'}</span>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Fermer' : 'Ajout rapide (+)'}
          className={`w-10 h-10 rounded-full bg-[#37352f] dark:bg-[#ecebed] text-white dark:text-[#191919] hover:bg-[#22211e] dark:hover:bg-white shadow-md flex items-center justify-center transition-transform duration-150 ${
            isOpen ? 'rotate-45' : 'hover:scale-105'
          }`}
          aria-label="Quick add transaction"
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      <AddExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <AddIncomeModal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} />
      <AddContributionModal isOpen={isContributionOpen} onClose={() => setIsContributionOpen(false)} />
    </>
  );
};
