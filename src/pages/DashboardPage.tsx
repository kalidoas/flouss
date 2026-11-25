import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, ChevronDown, ListChecks, ShieldCheck, Tags, ReceiptText } from 'lucide-react';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { DashboardFocusNow } from '../components/dashboard/DashboardFocusNow';
import { DashboardTodayCard } from '../components/dashboard/DashboardTodayCard';
import { DashboardPinnedNote } from '../components/dashboard/DashboardPinnedNote';
import { DashboardSpendingCard } from '../components/dashboard/DashboardSpendingCard';
import { DashboardBillsCard } from '../components/dashboard/DashboardBillsCard';
import { DashboardAiWidget } from '../components/dashboard/DashboardAiWidget';
import { ProtectWorkspacePinCard } from '../components/dashboard/ProtectWorkspacePinCard';
import { AdjustBalanceModal } from '../components/dashboard/AdjustBalanceModal';
import { selectDashboardFinancials } from '../utils/calculations';
import { getCurrentMonthStr } from '../utils/formatters';
import { useDashboardHeader } from '../components/layout/DashboardHeaderContext';
import { DashboardKpis } from '../components/dashboard/DashboardKpis';
import { RunwayGauge } from '../components/dashboard/RunwayGauge';
import { translations } from '../i18n/translations';

export const DashboardPage: React.FC = () => {
  const {
    initialBalance = null,
    transactions = [],
    categories = [],
    subscriptions = [],
    language,
    setActiveScreen,
  } = useAppStore();
  const txList = transactions || [];
  const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false);
  const { selectedMonth } = useDashboardHeader();
  const safeMonth = selectedMonth || getCurrentMonthStr();

  const hasData = (initialBalance !== null && initialBalance !== 0) || txList.length > 0;

  const summary = useMemo(
    () => selectDashboardFinancials(initialBalance, txList, selectedMonth),
    [initialBalance, txList, selectedMonth]
  );

  return (
    <div className="mx-auto max-w-[1280px] w-full pb-28 sm:pb-32 animate-page select-text min-w-0">
      {/* 1. Optional Dismissible PIN Protection Card */}
      {hasData && <ProtectWorkspacePinCard onConfigurePin={() => setActiveScreen('settings')} />}

      {/* 2. Empty state when no data yet */}
      {!hasData && (
        <div className="mx-auto flex max-w-3xl flex-col gap-5 pt-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DashboardHero selectedMonth={safeMonth} emptyState />
          <section className="rounded-[24px] border border-border-subtle bg-surface p-5 sm:p-7" aria-labelledby="first-expense-heading">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-600"><ReceiptText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 id="first-expense-heading" className="text-lg font-semibold tracking-tight text-content">{translations[language].dashboard.emptyTitle}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{translations[language].dashboard.emptyDescription}</p>
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'expense' } }))} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-contrast shadow-sm transition-transform active:scale-[.98]">
                  <Plus className="h-4 w-4" />{translations[language].dashboard.emptyFirstExpense}
                </button>
              </div>
            </div>
          </section>
          <details className="group rounded-2xl border border-border-subtle bg-surface px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-1 text-sm font-semibold text-content [&::-webkit-details-marker]:hidden">
              <ListChecks className="h-4 w-4 text-accent-600" />
              <span className="flex-1">{translations[language].dashboard.emptyChecklist}</span>
              <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs tabular-nums text-muted">0/3</span>
              <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-3 grid gap-2 border-t border-border-subtle pt-3 text-sm text-muted sm:grid-cols-3">
              <li className="flex items-center gap-2"><ReceiptText className="h-4 w-4 shrink-0 text-accent-600" />{translations[language].dashboard.emptyStepExpense}</li>
              <li className="flex items-center gap-2"><Tags className="h-4 w-4 shrink-0 text-accent-600" />{translations[language].dashboard.emptyStepBudget}</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-accent-600" />{translations[language].dashboard.emptyStepPin}</li>
            </ul>
          </details>
        </div>
      )}

      {/* 3. Bento 2-column layout (>=1100px) / 1-column (<1100px) */}
      {hasData && (
        <div
          className="grid grid-cols-1 min-[1100px]:grid-cols-12 gap-5 min-w-0 items-start"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Main Column (7 cols): Balance hero, KPIs, Recent */}
          <div className="min-[1100px]:col-span-7 flex flex-col gap-5 min-w-0">
            <DashboardHero selectedMonth={safeMonth} />
            <DashboardKpis
              initialBalance={initialBalance}
              transactions={txList}
              categories={categories}
              subscriptions={subscriptions}
              language={language}
              selectedMonth={safeMonth}
            />
            <RunwayGauge
              initialBalance={initialBalance}
              transactions={txList}
              language={language}
            />
          </div>

          {/* Side Column (5 cols): Focus now, Today, Pinned note, Bills, Insights */}
          <div className="min-[1100px]:col-span-5 flex flex-col gap-5 min-w-0">
            <DashboardFocusNow />
            <DashboardTodayCard />
            <DashboardPinnedNote />
            <DashboardBillsCard
              subscriptions={subscriptions}
              language={language}
              onOpen={() => setActiveScreen('subscriptions')}
            />
            <DashboardAiWidget />
          </div>
        </div>
      )}

      <AdjustBalanceModal
        isOpen={adjustBalanceOpen}
        onClose={() => setAdjustBalanceOpen(false)}
        currentBalance={summary.balance}
      />
    </div>
  );
};
