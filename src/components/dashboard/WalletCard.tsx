import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppleGlassCard } from '../common/AppleGlassCard';
import { AnimatedCurrency } from '../common/AnimatedCurrency';
import { PrivacyCurrency } from '../common/PrivacyCurrency';
import { translations } from '../../i18n/translations';
import { formatMAD, getCurrentMonthStr, formatMonthYear } from '../../utils/formatters';
import { calculateAvailableBalance, selectAvailableBalance } from '../../utils/calculations';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
} from 'lucide-react';

interface WalletCardProps {
  balance?: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  onOpenIncome: () => void;
  onOpenExpense: () => void;
  onOpenGoal: () => void;
}

function getShiftedMonth(baseMonth: string, delta: number): string {
  const [yearStr, monthStr] = baseMonth.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  balance: propBalance,
  incomeThisMonth: currentLiveIncome,
  expenseThisMonth: currentLiveExpense,
  onOpenIncome,
  onOpenExpense,
  onOpenGoal,
}) => {
  const { balance: storeBalance, initialBalance, transactions, language, hideBalance, toggleHideBalance } = useAppStore();
  const tWallet = translations[language].walletCard;
  const currentMonth = getCurrentMonthStr();

  // Historical Month Navigation State
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const isCurrentMonth = selectedMonth === currentMonth;

  // Single source of truth selector matching AppleCardBalanceChart
  const activeBalance = selectAvailableBalance({
    initialBalance,
    transactions,
    balance: typeof propBalance === 'number' && !isNaN(propBalance) ? propBalance : storeBalance,
  });

  // Calculate historical balance and cashflow if viewing past months
  const { displayBalance, displayIncome, displayExpense } = useMemo(() => {
    if (isCurrentMonth) {
      return {
        displayBalance: activeBalance,
        displayIncome: currentLiveIncome,
        displayExpense: currentLiveExpense,
      };
    }

    // Historical calculation: transactions up to the end of selectedMonth
    const txUpToSelectedMonth = (transactions || []).filter(
      (tx) => tx.date.slice(0, 7) <= selectedMonth
    );
    const historicalBalance = calculateAvailableBalance(initialBalance, txUpToSelectedMonth);

    // Selected month's cashflow
    const monthTx = (transactions || []).filter((tx) => tx.date.slice(0, 7) === selectedMonth);
    const historicalIncome = monthTx
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const historicalExpense = monthTx
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    return {
      displayBalance: historicalBalance,
      displayIncome: historicalIncome,
      displayExpense: historicalExpense,
    };
  }, [
    isCurrentMonth,
    selectedMonth,
    activeBalance,
    currentLiveIncome,
    currentLiveExpense,
    transactions,
    initialBalance,
  ]);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => getShiftedMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      const next = getShiftedMonth(prev, 1);
      return next > currentMonth ? prev : next;
    });
  };

  const handleResetToCurrent = () => {
    setSelectedMonth(currentMonth);
  };

  const isNextDisabled = selectedMonth >= currentMonth;

  return (
    <AppleGlassCard className="p-5 sm:p-6 flex flex-col justify-between space-y-4 relative" enableTilt={true}>
      {/* Ambient background glow inside wallet card */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header of the Wallet Card */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">
            {isCurrentMonth ? tWallet.availableBalance : tWallet.historicalView.replace('{month}', '')}
          </span>
        </div>

        {/* Header Right: Privacy Toggle & Interactive Month Navigator */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleHideBalance}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="Privacy (H)"
          >
            {hideBalance ? <EyeOff className="w-3.5 h-3.5 text-emerald-500" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Interactive Historical Month Navigator */}
          <div
            dir="ltr"
            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-zinc-100/90 dark:bg-zinc-800/90 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs"
          >
            <button
              onClick={handlePrevMonth}
              title={tWallet.prevMonth}
              aria-label={tWallet.prevMonth}
              className="p-1 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <span className="px-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight whitespace-nowrap min-w-[70px] text-center">
              {formatMonthYear(selectedMonth, language)}
            </span>

            <button
              onClick={handleNextMonth}
              disabled={isNextDisabled}
              title={tWallet.nextMonth}
              aria-label={tWallet.nextMonth}
              className={`p-1 rounded-full transition-colors ${
                isNextDisabled
                  ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-40'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Historical Mode Notice Banner */}
      <AnimatePresence>
        {!isCurrentMonth && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-medium relative z-10"
          >
            <span className="flex items-center gap-1.5 truncate">
              <History className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span className="truncate">
                {tWallet.historicalNotice.replace('{month}', formatMonthYear(selectedMonth, language))}
              </span>
            </span>
            <button
              onClick={handleResetToCurrent}
              className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-[10px] font-bold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{tWallet.backToCurrent}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot-Machine Rolling Balance Number with Heavy Privacy Blur specifically on Solde Disponible */}
      <div className="space-y-1 relative z-10">
        <div
          onClick={toggleHideBalance}
          className={`inline-flex items-center gap-2 cursor-pointer group text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white tabular-nums transition-all ${
            hideBalance ? 'balance-heavy-blur' : ''
          }`}
          title={
            hideBalance
              ? language === 'ar'
                ? 'اضغط لإظهار الرصيد'
                : language === 'en'
                ? 'Click to reveal balance'
                : 'Cliquer pour afficher le solde'
              : language === 'ar'
              ? 'اضغط لإخفاء الرصيد'
              : language === 'en'
              ? 'Click to hide balance'
              : 'Cliquer pour masquer le solde'
          }
        >
          <AnimatedCurrency
            value={displayBalance}
            language={language}
            hideBalance={false}
            showCurrency={true}
          />
          {hideBalance && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-900/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 border border-black/10 dark:border-white/15 backdrop-blur-xl shadow-xs group-hover:scale-105 transition-transform">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'ar' ? 'إظهار' : language === 'en' ? 'Show' : 'Afficher'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Pills: + Income | - Expense | Save */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenIncome}
          className="py-2 px-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all text-center flex items-center justify-center gap-1 shadow-xs"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{tWallet.addIncome}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenExpense}
          className="py-2 px-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-500/25 transition-all text-center flex items-center justify-center gap-1 shadow-xs"
        >
          <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{tWallet.addExpense}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenGoal}
          className="py-2 px-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/25 transition-all text-center flex items-center justify-center gap-1 shadow-xs"
        >
          <PiggyBank className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{tWallet.saveGoal}</span>
        </motion.button>
      </div>

      {/* Compact Monthly Cashflow Summary */}
      <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs relative z-10">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
            {tWallet.income}
          </span>
          <PrivacyCurrency
            amount={displayIncome}
            showSign={true}
            className="font-bold text-emerald-600 dark:text-emerald-400 text-xs"
          />
        </div>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

        <div className="text-right">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
            {tWallet.expenses}
          </span>
          <PrivacyCurrency
            amount={displayExpense}
            prefix="-"
            className="font-bold text-rose-600 dark:text-rose-400 text-xs"
          />
        </div>
      </div>
    </AppleGlassCard>
  );
};
