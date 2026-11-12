import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import { MoneyText } from '../components/common/PrivacyCurrency';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { DashboardFocusNow } from '../components/dashboard/DashboardFocusNow';
import { DashboardTodayCard } from '../components/dashboard/DashboardTodayCard';
import { DashboardPinnedNote } from '../components/dashboard/DashboardPinnedNote';
import { DashboardSpendingCard } from '../components/dashboard/DashboardSpendingCard';
import { DashboardBillsCard } from '../components/dashboard/DashboardBillsCard';
import { DashboardRecentTransactions } from '../components/dashboard/DashboardRecentTransactions';
import { DashboardAiWidget } from '../components/dashboard/DashboardAiWidget';
import { ProtectWorkspacePinCard } from '../components/dashboard/ProtectWorkspacePinCard';
import { AdjustBalanceModal } from '../components/dashboard/AdjustBalanceModal';
import { Wallet, Pencil } from 'lucide-react';
import { selectDashboardFinancials } from '../utils/calculations';
import { getNetPresentation } from '../utils/dashboard';
import { isTransactionInMonth, getCurrentMonthStr } from '../utils/formatters';
import { translations } from '../i18n/translations';
import { useDashboardHeader } from '../components/layout/DashboardHeaderContext';

export const DashboardPage: React.FC = () => {
  const { initialBalance = null, transactions = [], categories = [], subscriptions = [], language, setActiveScreen } = useAppStore();
  const txList = transactions || [];
  const [showDetails, setShowDetails] = useState(false);
  const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false);
  const t = translations[language].dashboard;
  const { selectedMonth } = useDashboardHeader();
  const safeMonth = selectedMonth || getCurrentMonthStr();
  const summary = useMemo(
    () => selectDashboardFinancials(initialBalance, txList, safeMonth),
    [initialBalance, txList, safeMonth]
  );
  const selectedTransactions = useMemo(
    () => txList.filter((transaction) => isTransactionInMonth(transaction?.date, safeMonth)),
    [txList, safeMonth]
  );
  const incomeCount = selectedTransactions.filter((transaction) => transaction?.type === 'income').length;
  const expenseCount = selectedTransactions.filter((transaction) => transaction?.type === 'expense').length;
  const netPresentation = getNetPresentation(summary.net);
  const netCaption = t[netPresentation.caption];
  const netColor = netPresentation.tone === 'positive' ? 'text-positive' : netPresentation.tone === 'negative' ? 'text-negative' : 'text-muted';
  const recentTransactions = useMemo(() => [...txList]
    .sort((a, b) => (Date.parse(b?.date) || Date.parse(b?.createdAt) || 0) - (Date.parse(a?.date) || Date.parse(a?.createdAt) || 0))
    .slice(0, 5), [txList]);

  const statItems = [
    { key: 'income', label: t.incomeThisMonth, count: t.incomeCount.replace('{count}', String(incomeCount)), value: summary.income, color: 'text-positive', sign: true, prefix: '' },
    { key: 'expenses', label: t.expensesThisMonth, count: t.expenseCount.replace('{count}', String(expenseCount)), value: summary.expenses, color: 'text-negative', sign: false, prefix: '− ' },
    { key: 'net', label: t.netLabel, count: netCaption, value: summary.net, color: netColor, sign: true, prefix: '' },
  ];

  return (
    <div className="mx-auto max-w-[1280px] w-full pb-8 animate-page select-text">
      {/* 1. Optional Dismissible PIN Protection Card */}
      <ProtectWorkspacePinCard onConfigurePin={() => setActiveScreen('settings')} />

      {/* 2. Empty Balance CTA for accounts who skipped initial balance */}
      {txList.length === 0 && (initialBalance === null || initialBalance === 0) && (
        <div className="spotlight-card rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-zinc-900/40 p-4 sm:p-5 backdrop-blur-xl border border-emerald-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden mb-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {language === 'ar'
                    ? 'ابدأ بتحديد رصيدك الحالي'
                    : language === 'fr'
                    ? 'Définissez votre solde de départ'
                    : 'Set your starting balance'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {language === 'ar'
                    ? 'حدد المبلغ المتوفر لديك حالياً لبدء تتبع دقيق لأموالك.'
                    : language === 'fr'
                    ? 'Indiquez l’argent dont vous disposez pour démarrer un suivi précis.'
                    : 'Enter what you currently have to kick off accurate tracking.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdjustBalanceOpen(true)}
              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>
                {language === 'ar'
                  ? 'تحديد الرصيد'
                  : language === 'fr'
                  ? 'Définir le solde'
                  : 'Set balance'}
              </span>
            </button>
          </div>
        </div>
      )}

      <div
        className="columns-1 md:columns-2 xl:columns-3 gap-4"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Card 1: Available Balance Hero Tile */}
        <div className="break-inside-avoid mb-4">
          <DashboardHero selectedMonth={selectedMonth} />
        </div>

        {/* Card 2: Monthly Summary Card (Compact & Expandable) */}
        <section aria-label={t.monthlySummary} className="break-inside-avoid mb-4">
          <div
            data-spotlight="true"
            className="spotlight-card rounded-2xl bg-white/5 p-3.5 sm:p-4 md:p-4.5 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all duration-300 h-fit"
          >
            <div className={`grid ${showDetails ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] rtl:sm:divide-x-reverse gap-y-3 sm:gap-y-0 transition-all duration-300`}>
              {/* Income this month */}
              <div className="sm:px-3 first:ps-0 last:pe-0">
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block truncate">
                  {t.incomeThisMonth}
                </span>
                <MoneyText
                  amount={summary.income}
                  showSign={true}
                  className="mt-1 block max-w-full truncate text-base sm:text-lg md:text-xl font-bold tracking-tight tabular-nums text-emerald-400"
                />
                {showDetails && (
                  <p className="mt-0.5 text-caption text-zinc-500 truncate" title={t.incomeCount.replace('{count}', String(incomeCount))}>
                    {t.incomeCount.replace('{count}', String(incomeCount))}
                  </p>
                )}
              </div>

              {/* Expenses this month */}
              <div className="sm:px-3 first:ps-0 last:pe-0">
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block truncate">
                  {t.expensesThisMonth}
                </span>
                <MoneyText
                  amount={summary.expenses}
                  prefix="− "
                  showSign={false}
                  className="mt-1 block max-w-full truncate text-base sm:text-lg md:text-xl font-bold tracking-tight tabular-nums text-rose-400"
                />
                {showDetails && (
                  <p className="mt-0.5 text-caption text-zinc-500 truncate" title={t.expenseCount.replace('{count}', String(expenseCount))}>
                    {t.expenseCount.replace('{count}', String(expenseCount))}
                  </p>
                )}
              </div>

              {/* Net (Hidden by default, revealed on More details toggle) */}
              {showDetails && (
                <div className="pt-2.5 sm:pt-0 sm:px-3 first:ps-0 last:pe-0">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block truncate">
                    {t.netLabel}
                  </span>
                  <MoneyText
                    amount={summary.net}
                    showSign={true}
                    className={`mt-1 block max-w-full truncate text-base sm:text-lg md:text-xl font-bold tracking-tight tabular-nums ${summary.net >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}
                  />
                  <p className="mt-0.5 text-caption text-zinc-500 truncate" title={netCaption}>
                    {netCaption}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Toggle Bar */}
            <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors active:scale-95 duration-200"
              >
                <span>
                  {showDetails
                    ? language === 'ar'
                      ? 'تفاصيل أقل ←'
                      : 'Less details ←'
                    : language === 'ar'
                    ? 'المزيد من التفاصيل →'
                    : 'More details →'}
                </span>
              </button>
              {showDetails && (
                <span className="text-[10px] text-zinc-500 truncate">
                  {translations[language].summaryScopes.dashboard}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Card 3: Spending Breakdown */}
        <div className="break-inside-avoid mb-4">
          <DashboardSpendingCard
            categories={categories}
            transactions={transactions}
            selectedMonth={selectedMonth}
            totalExpense={summary.expenses}
            language={language}
            onOpenBudgets={() => setActiveScreen('categories')}
          />
        </div>

        {/* Card 4: Focus Now (Tasks) */}
        <DashboardFocusNow />

        {/* Card 5: Today's Program */}
        <div className="break-inside-avoid mb-4">
          <DashboardTodayCard />
        </div>

        {/* Card 6: Flouss AI Copilot */}
        <div className="break-inside-avoid mb-4">
          <DashboardAiWidget />
        </div>

        {/* Card 7: Pinned Note */}
        <div className="break-inside-avoid mb-4">
          <DashboardPinnedNote />
        </div>

        {/* Card 8: Upcoming Bills */}
        <div className="break-inside-avoid mb-4">
          <DashboardBillsCard
            subscriptions={subscriptions}
            language={language}
            onOpen={() => setActiveScreen('subscriptions')}
          />
        </div>

        {/* Card 9: Recent Transactions */}
        <div className="break-inside-avoid mb-4">
          <DashboardRecentTransactions
            transactions={recentTransactions}
            onViewAll={() => setActiveScreen('history')}
          />
        </div>
      </div>

      <AdjustBalanceModal
        isOpen={adjustBalanceOpen}
        onClose={() => setAdjustBalanceOpen(false)}
        currentBalance={summary.balance}
      />
    </div>
  );
};
