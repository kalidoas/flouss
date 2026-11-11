import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../common/Card';
import { MoneyText } from '../common/PrivacyCurrency';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { AddContributionModal } from '../transactions/AddContributionModal';
import { BalanceSparkline, buildBalanceSeries } from './BalanceSparkline';
import { selectDashboardFinancials } from '../../utils/calculations';
import { getCurrentMonthStr } from '../../utils/formatters';
import { getDailyRateInsight } from '../../utils/dashboard';
import { translations } from '../../i18n/translations';
import { ArrowDownRight, ArrowUpRight, Pencil, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';

interface Props { selectedMonth: string; }

export const DashboardHero: React.FC<Props> = ({ selectedMonth }) => {
  const { initialBalance, transactions, language } = useAppStore();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const t = translations[language].dashboard;
  const tCommon = translations[language].common;
  const tWallet = translations[language].walletCard;
  const currentMonth = getCurrentMonthStr();
  const today = new Date();
  const isCurrentMonth = selectedMonth === currentMonth;
  const summary = useMemo(
    () => selectDashboardFinancials(initialBalance, transactions, selectedMonth),
    [initialBalance, transactions, selectedMonth]
  );
  const series = useMemo(
    () => buildBalanceSeries(initialBalance, transactions, selectedMonth, currentMonth, today),
    [initialBalance, transactions, selectedMonth, currentMonth]
  );
  const dailyInsight = getDailyRateInsight(summary.balance, selectedMonth, today);
  const openingBalance = series.length ? series[0].balance - series[0].change : 0;
  const delta = summary.balance - openingBalance;
  const deltaPercent = openingBalance !== 0 ? Math.round((delta / Math.abs(openingBalance)) * 100) : 0;
  const deltaPositive = delta >= 0;

  const quickAdd = (type: 'income' | 'expense') => window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type } }));

  return (
    <>
      <div
        data-spotlight="true"
        className="spotlight-card group relative overflow-hidden rounded-2xl bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)]"
        style={{ backgroundImage: 'radial-gradient(ellipse 75% 65% at 0% 0%, rgba(99,102,241,0.18), transparent 70%)' }}
      >
        <div className="relative z-10 flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
              — {t.totalBalance}
            </p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <MoneyText
                amount={summary.balance}
                className="min-w-0 max-w-full text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-white"
                currencyClassName="text-[.45em] font-medium tracking-normal text-zinc-400 ms-1.5"
              />
              {isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => setAdjustOpen(true)}
                  aria-label={tWallet.adjustBalance}
                  title={tWallet.adjustBalance}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 opacity-90 transition hover:bg-white/[0.08] hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 duration-200"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {dailyInsight && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  <span className="text-zinc-400">{t.about}</span>
                  <MoneyText amount={dailyInsight.amountPerDay} className="font-semibold text-white tabular-nums" />
                  <span className="text-zinc-400">/ {t.perDay.replace('/', '').trim()}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">{dailyInsight.daysLeft} {t.daysLeft}</span>
                </div>
              )}

              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${deltaPositive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'}`}>
                {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {delta > 0 ? '+' : ''}{deltaPercent}% {t.deltaThisMonth}
              </span>
            </div>
          </div>

          {/* Compact Glass Pill Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => quickAdd('income')}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-emerald-300 backdrop-blur-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{tCommon.addIncome}</span>
            </button>
            <button
              type="button"
              onClick={() => quickAdd('expense')}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-rose-300 backdrop-blur-xl hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span>{tCommon.addExpense}</span>
            </button>
            <button
              type="button"
              onClick={() => setContributionOpen(true)}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-white/5 hover:bg-indigo-500/15 border border-white/10 hover:border-indigo-500/30 px-3 py-1 text-xs font-medium text-zinc-200 hover:text-indigo-300 backdrop-blur-xl hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <PiggyBank className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{tWallet.saveGoal}</span>
            </button>
          </div>
        </div>

        {/* Embedded Sparkline with Zero Wasted Padding */}
        <div className="-mx-4 -mb-4 sm:-mx-5 sm:-mb-5 mt-2">
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
      </div>
      <AdjustBalanceModal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} currentBalance={summary.balance} />
      <AddContributionModal isOpen={contributionOpen} onClose={() => setContributionOpen(false)} />
    </>
  );
};
