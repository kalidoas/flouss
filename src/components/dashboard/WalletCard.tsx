import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppleGlassCard } from '../common/AppleGlassCard';
import { AnimatedCurrency } from '../common/AnimatedCurrency';
import { translations } from '../../i18n/translations';
import { formatMAD, getCurrentMonthStr, formatMonthYear } from '../../utils/formatters';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface WalletCardProps {
  balance: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  onOpenIncome: () => void;
  onOpenExpense: () => void;
  onOpenGoal: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  balance,
  incomeThisMonth,
  expenseThisMonth,
  onOpenIncome,
  onOpenExpense,
  onOpenGoal,
}) => {
  const { language, hideBalance, toggleHideBalance } = useAppStore();
  const tWallet = translations[language].walletCard;
  const currentMonth = getCurrentMonthStr();

  return (
    <AppleGlassCard className="p-5 sm:p-6 flex flex-col justify-between space-y-5 relative" enableTilt={true}>
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
            {tWallet.availableBalance}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleHideBalance}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="Privacy (H)"
          >
            {hideBalance ? <EyeOff className="w-3.5 h-3.5 text-emerald-500" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
            {formatMonthYear(currentMonth, language)}
          </span>
        </div>
      </div>

      {/* Slot-Machine Rolling Balance Number */}
      <div className="space-y-1 relative z-10">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white tabular-nums">
          <AnimatedCurrency
            value={balance}
            language={language}
            hideBalance={hideBalance}
            showCurrency={true}
          />
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
          <span
            className={`font-bold text-emerald-600 dark:text-emerald-400 tabular-nums ${
              hideBalance ? 'privacy-blur' : ''
            }`}
          >
            +{formatMAD(incomeThisMonth, false, language)}
          </span>
        </div>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

        <div className="text-right">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
            {tWallet.expenses}
          </span>
          <span
            className={`font-bold text-rose-600 dark:text-rose-400 tabular-nums ${
              hideBalance ? 'privacy-blur' : ''
            }`}
          >
            -{formatMAD(expenseThisMonth, false, language)}
          </span>
        </div>
      </div>
    </AppleGlassCard>
  );
};
