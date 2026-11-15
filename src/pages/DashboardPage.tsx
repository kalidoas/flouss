import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
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
import { getCurrentMonthStr } from '../utils/formatters';
import { useDashboardHeader } from '../components/layout/DashboardHeaderContext';

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
    () => selectDashboardFinancials(initialBalance, txList, safeMonth),
    [initialBalance, txList, safeMonth]
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

      {/* 2. Empty Balance CTA for accounts who skipped initial balance */}
      {txList.length === 0 && (initialBalance === null || initialBalance === 0) && (
        <div className="spotlight-card rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-zinc-900/40 p-4 sm:p-5 backdrop-blur-xl border border-emerald-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden mb-5 animate-in fade-in duration-300 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-content dark:text-white tracking-tight truncate">
                  {language === 'ar'
                    ? 'ابدأ بتحديد رصيدك الحالي'
                    : language === 'fr'
                    ? 'Définissez votre solde de départ'
                    : 'Set your starting balance'}
                </h3>
                <p className="text-xs text-muted dark:text-zinc-400 mt-0.5 truncate">
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

      {/* 3. Bento 2-column layout (>=1100px) / 1-column (<1100px) */}
      <div
        className="grid grid-cols-1 min-[1100px]:grid-cols-12 gap-5 min-w-0 items-start"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Main Column (7 cols): Balance hero, Spending, Recent */}
        <div className="min-[1100px]:col-span-7 flex flex-col gap-5 min-w-0">
          <DashboardHero selectedMonth={safeMonth} />
          <DashboardSpendingCard
            categories={categories}
            transactions={transactions}
            selectedMonth={safeMonth}
            totalExpense={summary.expenses}
            language={language}
            onOpenBudgets={() => setActiveScreen('categories')}
          />
          <DashboardRecentTransactions
            transactions={recentTransactions}
            onViewAll={() => setActiveScreen('history')}
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
