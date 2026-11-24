import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
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

  const summary = useMemo(
    () => selectDashboardFinancials(initialBalance, txList, selectedMonth),
    [initialBalance, txList, selectedMonth]
  );

  const recentTransactions = useMemo(
    () =>
      [...txList]
        .sort(
          (a, b) =>
            (Date.parse(b?.date) || Date.parse(b?.createdAt) || 0) -
            (Date.parse(a?.date) || Date.parse(a?.createdAt) || 0)
        )
        .slice(0, 5),
    [txList]
  );

  return (
    <div className="mx-auto max-w-[1280px] w-full pb-28 sm:pb-32 animate-page select-text min-w-0">
      {/* 1. Optional Dismissible PIN Protection Card */}
      <ProtectWorkspacePinCard onConfigurePin={() => setActiveScreen('settings')} />

      
      {/* 3. Bento 2-column layout (>=1100px) / 1-column (<1100px) */}
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

      <AdjustBalanceModal
        isOpen={adjustBalanceOpen}
        onClose={() => setAdjustBalanceOpen(false)}
        currentBalance={summary.balance}
      />
    </div>
  );
};