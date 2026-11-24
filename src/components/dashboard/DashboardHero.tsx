import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MoneyText } from '../common/PrivacyCurrency';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { AddContributionModal } from '../transactions/AddContributionModal';
import { BalanceSparkline, buildBalanceSeries } from './BalanceSparkline';
import { selectDashboardFinancials } from '../../utils/calculations';
import { getCurrentMonthStr, isTransactionInMonth } from '../../utils/formatters';
import { getDailyRateInsight, getNetPresentation } from '../../utils/dashboard';
import { translations } from '../../i18n/translations';
import { ArrowDownRight, ArrowUpRight, Pencil, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { Reveal } from '../../motion';

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
  const dailyInsight = getDailyRateInsight(summary.balance, safeMonth, today);
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
        className="spotlight-card group relative overflow-hidden rounded-2xl bg-surface dark:bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-white/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] min-w-0"
        style={{ backgroundImage: 'radial-gradient(ellipse 75% 65% at 0% 0%, rgba(99,102,241,0.14), transparent 70%)' }}
      >
        <div className="relative z-10 flex flex-col gap-3 min-w-0">
          {/* Title & Edit Button (sentence case, 15-17px, font-semibold) */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h1 className="text-[15px] sm:text-base font-semibold text-muted dark:text-zinc-300 truncate">
              {t.totalBalance}
            </h1>
            {isCurrentMonth && (
              <button
                type="button"
                onClick={() => setAdjustOpen(true)}
                aria-label={tWallet.adjustBalance}
                title={tWallet.adjustBalance}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:text-content hover:bg-surface-raised dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white transition-all active:scale-95 duration-200 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Balance Amount (56-64px) */}
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 min-w-0">
            <MoneyText
              amount={summary.balance}
              className="text-[52px] sm:text-[56px] lg:text-[64px] font-bold leading-none tracking-tight tabular-nums text-content dark:text-white min-w-0"
            />
          </div>

          {/* Delta Chip & Daily Rate Insight */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0 ${
                deltaPositive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {deltaPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{delta > 0 ? '+' : ''}{deltaPercent}% {t.deltaThisMonth}</span>
            </span>

            {dailyInsight && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised/80 dark:bg-white/[0.04] border border-border-subtle dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-muted dark:text-zinc-300 min-w-0">
                <span>{t.about}</span>
                <MoneyText amount={dailyInsight.amountPerDay} className="font-semibold text-content dark:text-white tabular-nums" />
                <span>/ {t.perDay.replace('/', '').trim()}</span>
                <span className="text-zinc-400 dark:text-zinc-500">·</span>
                <span className="truncate">{dailyInsight.daysLeft} {t.daysLeft}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (44px Buttons) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1 w-full min-w-0">
        <button
          type="button"
          onClick={() => quickAdd('income')}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer min-w-0"
        >
          <ArrowUpRight className="h-4 w-4 shrink-0" />
          <span className="truncate">{tCommon.addIncome}</span>
        </button>
        <button
          type="button"
          onClick={() => quickAdd('expense')}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer min-w-0"
        >
          <ArrowDownRight className="h-4 w-4 shrink-0" />
          <span className="truncate">{tCommon.addExpense}</span>
        </button>
        <button
          type="button"
          onClick={() => setContributionOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer min-w-0"
        >
          <PiggyBank className="h-4 w-4 shrink-0" />
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
      <div className="grid grid-cols-3 divide-x divide-border-subtle dark:divide-white/10 rtl:divide-x-reverse pt-3.5 border-t border-border-subtle dark:border-white/10 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 sm:px-5 pb-4 sm:pb-5 bg-surface-raised/40 dark:bg-white/[0.02]">
        {/* Income */}
        <div className="pe-2 sm:pe-3 first:ps-0 min-w-0">
          <p className="text-xs font-medium text-muted dark:text-zinc-400 truncate">
            {t.incomeThisMonth}
          </p>
          <MoneyText
            amount={summary.income}
            showSign={true}
            className="mt-1 block max-w-full truncate text-base sm:text-lg font-bold tracking-tight tabular-nums text-positive"
          />
          <p className="mt-0.5 text-[11px] text-muted dark:text-zinc-400 truncate">
            {t.incomeCount ? t.incomeCount.replace('{count}', String(incomeCount)) : `${incomeCount}`}
          </p>
        </div>

        {/* Expenses */}
        <div className="px-2 sm:px-3 min-w-0">
          <p className="text-xs font-medium text-muted dark:text-zinc-400 truncate">
            {t.expensesThisMonth}
          </p>
          <MoneyText
            amount={summary.expenses}
            prefix="− "
            showSign={false}
            className="mt-1 block max-w-full truncate text-base sm:text-lg font-bold tracking-tight tabular-nums text-negative"
          />
          <p className="mt-0.5 text-[11px] text-muted dark:text-zinc-400 truncate">
            {t.expenseCount ? t.expenseCount.replace('{count}', String(expenseCount)) : `${expenseCount}`}
          </p>
        </div>

        {/* Net */}
        <div className="ps-2 sm:ps-3 last:pe-0 min-w-0">
          <p className="text-xs font-medium text-muted dark:text-zinc-400 truncate">
            {t.netLabel}
          </p>
          <MoneyText
            amount={summary.net}
            showSign={true}
            className={`mt-1 block max-w-full truncate text-base sm:text-lg font-bold tracking-tight tabular-nums ${
              summary.net >= 0 ? 'text-indigo-500 dark:text-indigo-300' : 'text-negative'
            }`}
          />
          <p className="mt-0.5 text-[11px] text-muted dark:text-zinc-400 truncate">
            {netCaption}
          </p>
        </div>
      </div>
    </div>
  );
};

export const HeroModals = AdjustBalanceModal;
export { AdjustBalanceModal };
export { AddContributionModal };