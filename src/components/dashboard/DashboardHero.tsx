import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MoneyText } from '../common/PrivacyCurrency';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { AddContributionModal } from '../transactions/AddContributionModal';
import { BalanceSparkline, buildBalanceSeries } from './BalanceSparkline';
import { selectDashboardFinancials } from '../../utils/calculations';
import { getCurrentMonthStr, isTransactionInMonth } from '../../utils/formatters';
import { getNetPresentation } from '../../utils/dashboard';
import { translations } from '../../i18n/translations';
import { ArrowDownRight, ArrowUpRight, Pencil, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { GrainyHeroBackdrop } from '../backgrounds/GrainyHeroBackdrop';

interface Props {
  selectedMonth: string;
}

export const DashboardHero: React.FC<Props> = ({ selectedMonth }) => {
  const { initialBalance = null, transactions = [], language } = useAppStore();
  const txList = transactions || [];
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const t = translations[language].dashboard;
  const tCommon = translations[language].common;
  const tWallet = translations[language].walletCard;
  const currentMonth = getCurrentMonthStr();
  const safeMonth = selectedMonth || currentMonth;
  const today = new Date();
  const isCurrentMonth = safeMonth === currentMonth;

  const summary = useMemo(
    () => selectDashboardFinancials(initialBalance, txList, safeMonth),
    [initialBalance, txList, safeMonth]
  );
  const series = useMemo(
    () => buildBalanceSeries(initialBalance, txList, safeMonth, currentMonth, today),
    [initialBalance, txList, safeMonth, currentMonth]
  );
  const openingBalance = series.length ? series[0].balance - series[0].change : 0;
  const delta = summary.balance - openingBalance;
  const deltaPercent = openingBalance !== 0 ? Math.round((delta / Math.abs(openingBalance)) * 100) : 0;
  const deltaPositive = delta >= 0;

  const selectedTransactions = useMemo(
    () => txList.filter((transaction) => isTransactionInMonth(transaction?.date, safeMonth)),
    [txList, safeMonth]
  );
  const incomeCount = selectedTransactions.filter((transaction) => transaction?.type === 'income').length;
  const expenseCount = selectedTransactions.filter((transaction) => transaction?.type === 'expense').length;
  const netPresentation = getNetPresentation(summary.net);
  const netCaption = t[netPresentation.caption];

  const quickAdd = (type: 'income' | 'expense') =>
    window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type } }));

  return (
    <div className="relative z-0 min-w-0">
      {/* Hero Balance Card */}
      <div
        data-spotlight="true"
        className="spotlight-card flouss-balance-hero group relative isolate overflow-hidden rounded-[24px] bg-surface dark:bg-surface-3/5 p-5 sm:p-6 border border-border-subtle dark:border-white/10 shadow-xs min-w-0 min-h-[190px] sm:min-h-[218px]"
      >
        <GrainyHeroBackdrop />
        <div className="relative z-10 flex flex-col gap-2 min-w-0">
          {/* Title & Edit Button (sentence case, 15-17px, font-semibold) */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h1 className="text-[13px] sm:text-xs font-semibold text-muted dark:text-muted truncate leading-tight">
              {t.totalBalance}
            </h1>
            {isCurrentMonth && (
              <button
                type="button"
                onClick={() => setAdjustOpen(true)}
                aria-label={tWallet.adjustBalance}
                title={tWallet.adjustBalance}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:text-content hover:bg-surface-raised dark:text-content dark:hover:bg-surface-raised/[0.08] dark:hover:text-content transition-all active:scale-95 duration-200 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Balance Amount (compact) */}
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 min-w-0 mt-4 sm:mt-5">
            <MoneyText
              amount={summary.balance}
              className="text-[44px] sm:text-[52px] lg:text-[58px] font-bold leading-none tracking-[-0.055em] tabular-nums text-content dark:text-content min-w-0"
            />
          </div>

          {/* Delta Chip */}
          <div className="flex items-center gap-2 min-w-0 mt-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                deltaPositive
                  ? 'border-accent-500/20 bg-accent-500/10 text-positive dark:text-positive'
                  : 'border-negative-500/20 bg-negative-500/10 text-negative dark:text-negative'
              }`}
            >
              {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{delta > 0 ? '+' : ''}{deltaPercent}% {t.deltaThisMonth}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions (compact) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-3 w-full min-w-0">
        <button
          type="button"
          onClick={() => quickAdd('income')}
          className="inline-flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface/70 hover:bg-surface-raised px-2 py-2 text-[11px] sm:text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer min-w-0"
        >
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-positive" />
          <span className="truncate text-muted">{tCommon.addIncome}</span>
        </button>
        <button
          type="button"
          onClick={() => quickAdd('expense')}
          className="inline-flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface/70 hover:bg-surface-raised px-2 py-2 text-[11px] sm:text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer min-w-0"
        >
          <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{tCommon.addExpense}</span>
        </button>
        <button
          type="button"
          onClick={() => setContributionOpen(true)}
          className="inline-flex min-h-[42px] items-center justify-center gap-1 rounded-xl bg-accent-500/10 hover:bg-accent-500/15 border border-accent-500/20 text-accent-600 dark:text-accent-400 px-2 py-2 text-[11px] sm:text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer min-w-0"
        >
          <PiggyBank className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{tWallet.saveGoal}</span>
        </button>
      </div>

      {/* Embedded Sparkline (Full Card Width) */}
      <div className="relative z-10 -mx-4 sm:-mx-5 mt-2">
        <BalanceSparkline
          initialBalance={initialBalance}
          transactions={transactions}
          selectedMonth={selectedMonth}
          currentMonth={currentMonth}
          language={language}
          chartLabel={t.chartBalanceTrend}
          balanceLabel={t.totalBalance}
          changeLabel={t.dailyChange}
        />
      </div>

      {/* Three Stat Tiles (Income, Expenses, Net) Inside the Hero Card */}
      <div className="grid grid-cols-3 divide-x divide-border-subtle dark:divide-white/10 rtl:divide-x-reverse pt-2.5 border-t border-border-subtle dark:border-white/10 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 sm:px-5 pb-3 sm:pb-4 bg-surface-raised/40 dark:bg-surface-raised/[0.02]">
        {/* Income */}
        <div className="pe-1.5 sm:pe-2 first:ps-0 min-w-0">
          <p className="text-[10px] font-medium text-muted dark:text-muted truncate leading-tight">
            {t.incomeThisMonth}
          </p>
          <MoneyText
            amount={summary.income}
            showSign={true}
            className="mt-0.5 block max-w-full truncate text-xs sm:text-sm font-bold tracking-tight tabular-nums text-positive leading-tight"
          />
          <p className="mt-0.5 text-[9px] text-muted dark:text-muted truncate leading-tight">
            {t.incomeCount ? t.incomeCount.replace('{count}', String(incomeCount)) : `${incomeCount}`}
          </p>
        </div>

        {/* Expenses */}
        <div className="px-1.5 sm:px-2 min-w-0">
          <p className="text-[10px] font-medium text-muted dark:text-muted truncate leading-tight">
            {t.expensesThisMonth}
          </p>
          <MoneyText
            amount={summary.expenses}
            prefix="− "
            showSign={false}
            className="mt-0.5 block max-w-full truncate text-xs sm:text-sm font-bold tracking-tight tabular-nums text-negative leading-tight"
          />
          <p className="mt-0.5 text-[9px] text-muted dark:text-muted truncate leading-tight">
            {t.expenseCount ? t.expenseCount.replace('{count}', String(expenseCount)) : `${expenseCount}`}
          </p>
        </div>

        {/* Net */}
        <div className="ps-1.5 sm:ps-2 last:pe-0 min-w-0">
          <p className="text-[10px] font-medium text-muted dark:text-muted truncate leading-tight">
            {t.netLabel}
          </p>
          <MoneyText
            amount={summary.net}
            showSign={true}
            className={`mt-0.5 block max-w-full truncate text-xs sm:text-sm font-bold tracking-tight tabular-nums leading-tight ${
              summary.net >= 0 ? 'text-accent-500 dark:text-accent-300' : 'text-negative'
            }`}
          />
          <p className="mt-0.5 text-[9px] text-muted dark:text-muted truncate leading-tight">
            {netCaption}
          </p>
        </div>
      </div>

      {/* Modals */}
      <AdjustBalanceModal
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        currentBalance={summary.balance}
      />
      <AddContributionModal
        isOpen={contributionOpen}
        onClose={() => setContributionOpen(false)}
      />
    </div>
  );
};
