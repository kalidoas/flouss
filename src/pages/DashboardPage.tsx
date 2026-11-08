import React, { useMemo } from 'react';
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
import { selectDashboardFinancials } from '../utils/calculations';
import { getNetPresentation } from '../utils/dashboard';
import { isTransactionInMonth } from '../utils/formatters';
import { translations } from '../i18n/translations';
import { useDashboardHeader } from '../components/layout/DashboardHeaderContext';

export const DashboardPage: React.FC = () => {
  const { initialBalance, transactions, categories, subscriptions = [], language, setActiveScreen } = useAppStore();
  const t = translations[language].dashboard;
  const { selectedMonth } = useDashboardHeader();
  const summary = useMemo(
    () => selectDashboardFinancials(initialBalance, transactions, selectedMonth),
    [initialBalance, transactions, selectedMonth]
  );
  const selectedTransactions = useMemo(
    () => transactions.filter((transaction) => isTransactionInMonth(transaction.date, selectedMonth)),
    [transactions, selectedMonth]
  );
  const incomeCount = selectedTransactions.filter((transaction) => transaction.type === 'income').length;
  const expenseCount = selectedTransactions.filter((transaction) => transaction.type === 'expense').length;
  const netPresentation = getNetPresentation(summary.net);
  const netCaption = t[netPresentation.caption];
  const netColor = netPresentation.tone === 'positive' ? 'text-positive' : netPresentation.tone === 'negative' ? 'text-negative' : 'text-muted';
  const recentTransactions = useMemo(() => [...transactions]
    .sort((a, b) => (Date.parse(b.date) || Date.parse(b.createdAt) || 0) - (Date.parse(a.date) || Date.parse(a.createdAt) || 0))
    .slice(0, 5), [transactions]);

  const statItems = [
    { key: 'income', label: t.incomeThisMonth, count: t.incomeCount.replace('{count}', String(incomeCount)), value: summary.income, color: 'text-positive', sign: true, prefix: '' },
    { key: 'expenses', label: t.expensesThisMonth, count: t.expenseCount.replace('{count}', String(expenseCount)), value: summary.expenses, color: 'text-negative', sign: false, prefix: '− ' },
    { key: 'net', label: t.netLabel, count: netCaption, value: summary.net, color: netColor, sign: true, prefix: '' },
  ];

  return (
    <div className="mx-auto max-w-[1160px] space-y-4 pb-2 animate-page select-text">
      <DashboardFocusNow />
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="min-w-0 lg:col-start-1 lg:row-start-1">
          <DashboardHero selectedMonth={selectedMonth} />
        </section>
        <div className="lg:col-start-2 lg:row-start-1">
          <DashboardTodayCard />
        </div>

        <section aria-label={t.monthlySummary} className="min-w-0 space-y-2 lg:col-start-1 lg:row-start-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {statItems.map((stat) => <Card key={stat.key} padding="sm" className="min-w-0">
            <p className="truncate text-xs font-medium text-muted">{stat.label}</p>
            <MoneyText amount={stat.value} prefix={stat.prefix} showSign={stat.sign} className={`mt-1 block max-w-full truncate text-lg font-semibold ${stat.color}`} />
            <p className="mt-1 truncate text-[11px] text-muted" title={stat.count}>{stat.count}</p>
          </Card>)}
          </div>
          <p className="px-1 text-[11px] text-muted">{translations[language].summaryScopes.dashboard}</p>
        </section>
        <div className="lg:col-start-2 lg:row-start-2">
          <DashboardPinnedNote />
        </div>

        <div className="lg:col-start-1 lg:row-start-3">
          <DashboardSpendingCard
            categories={categories}
            transactions={transactions}
            selectedMonth={selectedMonth}
            totalExpense={summary.expenses}
            language={language}
            onOpenBudgets={() => setActiveScreen('categories')}
          />
        </div>
        <div className="lg:col-start-2 lg:row-start-3">
          <DashboardBillsCard subscriptions={subscriptions} language={language} onOpen={() => setActiveScreen('subscriptions')} />
        </div>
        <div className="lg:col-span-2 lg:row-start-4">
          <DashboardRecentTransactions transactions={recentTransactions} onViewAll={() => setActiveScreen('history')} />
        </div>
      </div>
    </div>
  );
};
