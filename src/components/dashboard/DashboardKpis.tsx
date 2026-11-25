import React, { useMemo } from 'react';
import { Money } from '../common/Money';
import { translations } from '../../i18n/translations';
import { selectMonthlyFinancialKpis, selectDailyBudgetKpi } from '../../utils/dashboardKpis';
import { Transaction, Category, SubscriptionItem } from '../../types';

interface Props {
  initialBalance: number | null;
  transactions: Transaction[];
  categories: Category[];
  subscriptions: SubscriptionItem[];
  language: 'ar' | 'fr' | 'en';
  selectedMonth: string;
}

export const DashboardKpis: React.FC<Props> = ({
  initialBalance,
  transactions,
  categories,
  subscriptions,
  language,
  selectedMonth,
}) => {
  const t = translations[language].dashboard;
  const tCommon = translations[language].common;

  const monthlyKpis = useMemo(
    () => selectMonthlyFinancialKpis(initialBalance, transactions, selectedMonth),
    [initialBalance, transactions, selectedMonth]
  );

  const dailyBudgetKpi = useMemo(
    () => selectDailyBudgetKpi(monthlyKpis.balance, subscriptions),
    [monthlyKpis.balance, subscriptions]
  );

  const { balance, savingsRate, net } = monthlyKpis;
  const { dailyBudget } = dailyBudgetKpi;

  return (
    <div className="spotlight-card rounded-2xl bg-surface dark:bg-surface-3/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-border-subtle/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] min-w-0">
      <div className="grid grid-cols-3 gap-3 min-w-0">
        {/* Net */}
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted dark:text-muted truncate">
            {t.netLabel}
          </p>
          <Money
            amount={net}
            showSign={true}
            className={`mt-1 block max-w-full truncate text-base sm:text-lg font-bold tracking-tight tabular-nums ${
              net >= 0 ? 'text-accent-500 dark:text-accent-300' : 'text-negative'
            }`}
          />
        </div>

        {/* Savings Rate */}
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted dark:text-muted truncate">
            {t.savingsRateLabel}
          </p>
          <div className="mt-1 block max-w-full truncate text-base sm:text-lg font-bold tracking-tight tabular-nums text-content dark:text-content">
            {savingsRate !== null ? `${savingsRate}%` : '—'}
          </div>
        </div>

        {/* Safe-to-spend / Daily Budget */}
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted dark:text-muted truncate">
            {t.safeToSpend}
          </p>
          <div className="mt-1 block max-w-full truncate text-base sm:text-lg font-bold tracking-tight tabular-nums text-content dark:text-content">
            {dailyBudget !== null ? (
              <Money amount={dailyBudget} showSign={true} className="inline" />
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};