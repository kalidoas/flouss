import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateAvailableBalance, calculateTotalSavingsInGoals } from '../../utils/calculations';
import { formatMAD, getCurrentMonthStr } from '../../utils/formatters';
import { Transaction } from '../../types';
import { Coins, ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';

export const BalanceWidget: React.FC = () => {
  const { balance: storeBalance, initialBalance, transactions, categories, hideBalance, language } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const balance =
    typeof storeBalance === 'number' && !isNaN(storeBalance)
      ? storeBalance
      : calculateAvailableBalance(initialBalance, transactions);
  const totalInGoals = calculateTotalSavingsInGoals(categories, transactions);

  const currentMonth = getCurrentMonthStr();
  const currentMonthTx = transactions.filter((t: Transaction) => t.date.startsWith(currentMonth));
  const incomeThisMonth = currentMonthTx
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  const expenseThisMonth = currentMonthTx
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  const isAr = language === 'ar';

  return (
    <aside
      aria-label="Solde disponible"
      className="fixed bottom-20 md:bottom-5 left-4 z-40 select-none max-w-[calc(100vw-2rem)] sm:max-w-xs"
    >
      <div className="bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] rounded-lg shadow-sm overflow-hidden transition-all duration-200">
        {/* Header / Collapsed Trigger Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[#fbfbfa] dark:hover:bg-[#252525] transition-colors"
          title={isExpanded ? 'Réduire' : 'Afficher les détails du solde'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-[#f1f0ee] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed] flex items-center justify-center shrink-0">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] block leading-tight">
                {isAr ? 'الرصيد المتاح' : 'Solde disponible'}
              </span>
              <span
                className={`text-xs font-semibold tabular-nums text-[#37352f] dark:text-[#ecebed] block truncate transition-[filter] duration-200 ${
                  hideBalance ? 'privacy-blur' : ''
                }`}
              >
                {formatMAD(balance, false, language)}
              </span>
            </div>
          </div>

          <div className="text-[#787774] dark:text-[#9b9a97] shrink-0">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Expandable Breakdown Drawer */}
        {isExpanded && (
          <div className="px-3 pt-1 pb-3 border-t border-[#e3e2de] dark:border-[#2f2f2f] space-y-2 bg-[#fbfbfa] dark:bg-[#1a1a1a] text-xs">
            {/* Income */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-[#787774] dark:text-[#9b9a97]">
                <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'مداخيل الشهر' : 'Revenus'}</span>
              </span>
              <span
                className={`font-medium tabular-nums text-emerald-600 dark:text-emerald-400 transition-[filter] duration-200 ${
                  hideBalance ? 'privacy-blur' : ''
                }`}
              >
                +{formatMAD(incomeThisMonth, false, language)}
              </span>
            </div>

            {/* Expenses */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[#787774] dark:text-[#9b9a97]">
                <ArrowDownRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span>{isAr ? 'مصاريف الشهر' : 'Dépenses'}</span>
              </span>
              <span
                className={`font-medium tabular-nums text-rose-600 dark:text-rose-400 transition-[filter] duration-200 ${
                  hideBalance ? 'privacy-blur' : ''
                }`}
              >
                -{formatMAD(expenseThisMonth, false, language)}
              </span>
            </div>

            {/* Savings in Goals */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#e3e2de] dark:border-[#2f2f2f]">
              <span className="flex items-center gap-1.5 text-[#787774] dark:text-[#9b9a97]">
                <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{isAr ? 'في الأهداف' : 'En épargne'}</span>
              </span>
              <span
                className={`font-medium tabular-nums text-[#37352f] dark:text-[#ecebed] transition-[filter] duration-200 ${
                  hideBalance ? 'privacy-blur' : ''
                }`}
              >
                {formatMAD(totalInGoals, false, language)}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
