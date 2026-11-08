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
      <Card padding="lg" className="group relative overflow-hidden border-white/[0.09] bg-[#111317] shadow-[0_18px_52px_rgba(0,0,0,.26)]" style={{ backgroundImage: 'radial-gradient(ellipse at 0% 0%, rgba(10,132,255,.19), transparent 56%)' }}>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#A1A1A6]">{t.totalBalance}</p>
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <MoneyText
                amount={summary.balance}
                className="min-w-0 max-w-full text-[clamp(1.8rem,8vw,4rem)] font-semibold leading-none tracking-[-.045em] text-[#F5F5F7]"
                currencyClassName="text-[.38em] font-medium tracking-normal text-[#A1A1A6]"
              />
              {isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => setAdjustOpen(true)}
                  aria-label={tWallet.adjustBalance}
                  title={tWallet.adjustBalance}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A1A1A6] opacity-100 transition hover:bg-white/[0.07] hover:text-[#F5F5F7] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            {dailyInsight && <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-sm text-[#A1A1A6]">
              <span>{t.about}</span><MoneyText amount={dailyInsight.amountPerDay} className="font-semibold text-[#F5F5F7]" />
              <span>{t.perDay}; {dailyInsight.daysLeft} {t.daysLeft}</span>
            </p>}
            <span className={`mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${deltaPositive ? 'border-[#30D158]/25 bg-[#30D158]/10 text-[#30D158]' : 'border-[#FF6961]/25 bg-[#FF453A]/10 text-[#FF6961]'}`}>
              {deltaPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {delta > 0 ? '+' : ''}{deltaPercent}% {t.deltaThisMonth}
            </span>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[320px]">
            <button type="button" onClick={() => quickAdd('income')} className="flex min-h-11 items-center justify-center gap-1.5 rounded-control border border-[#30D158]/20 bg-[#30D158]/10 px-2 text-xs font-semibold text-[#30D158] transition hover:bg-[#30D158]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]">
              <ArrowUpRight className="h-4 w-4 shrink-0" /><span className="truncate">{tCommon.addIncome}</span>
            </button>
            <button type="button" onClick={() => quickAdd('expense')} className="flex min-h-11 items-center justify-center gap-1.5 rounded-control border border-[#FF453A]/20 bg-[#FF453A]/10 px-2 text-xs font-semibold text-[#FF6961] transition hover:bg-[#FF453A]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]">
              <ArrowDownRight className="h-4 w-4 shrink-0" /><span className="truncate">{tCommon.addExpense}</span>
            </button>
            <button type="button" onClick={() => setContributionOpen(true)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-control border border-[#0A84FF]/25 bg-[#0A84FF]/10 px-2 text-xs font-semibold text-[#66B2FF] transition hover:bg-[#0A84FF]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]">
              <PiggyBank className="h-4 w-4 shrink-0" /><span className="truncate">{tWallet.saveGoal}</span>
            </button>
          </div>
        </div>
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
      </Card>
      <AdjustBalanceModal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} currentBalance={summary.balance} />
      <AddContributionModal isOpen={contributionOpen} onClose={() => setContributionOpen(false)} />
    </>
  );
};
