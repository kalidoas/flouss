import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import { MoneyText } from '../components/common/PrivacyCurrency';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { selectDashboardFinancials } from '../utils/calculations';
import { getCategoryName } from '../utils/i18nHelpers';
import { getCategoryIcon } from '../utils/icons';
import { calculateNextDueDate } from '../utils/subscriptions';
import { formatMonthYear } from '../utils/formatters';
import { translations } from '../i18n/translations';
import { Category, Transaction } from '../types';
import { CheckSquare, Receipt } from 'lucide-react';
import { useDashboardHeader } from '../components/layout/DashboardHeaderContext';

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const DashboardPage: React.FC = () => {
  const {
    initialBalance, transactions, categories, tasks, subscriptions, notes,
    language, hideBalance, setActiveScreen,
  } = useAppStore();
  const t = translations[language].dashboard;
  const { selectedMonth } = useDashboardHeader();
  const today = new Date();
  const todayKey = localDateString(today);

  const monthSummary = useMemo(
    () => selectDashboardFinancials(initialBalance, transactions, selectedMonth),
    [initialBalance, transactions, selectedMonth]
  );


  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense' || !transaction.categoryId || !transaction.date.startsWith(selectedMonth)) return;
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) || 0) + transaction.amount);
    });
    return categories
      .filter((category) => !category.isArchived && !category.isGoal && (totals.get(category.id) || 0) > 0)
      .map((category) => ({ category, spent: totals.get(category.id) || 0 }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 4);
  }, [categories, transactions, selectedMonth]);

  const upcomingBills = useMemo(() => subscriptions
    .filter((subscription) => !subscription.endDate || subscription.endDate >= todayKey)
    .map((subscription) => {
      const dueDate = subscription.nextDueDate || calculateNextDueDate(subscription, today);
      const isPaid = subscription.payments?.some((payment) => payment.cycleDate === dueDate)
        || subscription.paidMonths?.includes(dueDate.slice(0, 7));
      const days = Math.round((Date.parse(`${dueDate}T00:00:00`) - Date.parse(`${todayKey}T00:00:00`)) / 86_400_000);
      return { subscription, dueDate, days, isPaid: Boolean(isPaid) };
    })
    .filter((item) => !item.isPaid && item.days <= 45 && item.days >= -30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3), [subscriptions, todayKey]);

  const activeTasks = (tasks || []).filter((task) => !task.isArchived);
  const doneToday = activeTasks.filter((task) => task.completedDates?.includes(todayKey)).length;
  const pinnedNote = (notes || []).find((note) => note.isPinned);
  const recentTransactions = useMemo(() => [...transactions]
    .sort((a, b) => {
      const aTime = Date.parse(a.date) || Date.parse(a.createdAt) || 0;
      const bTime = Date.parse(b.date) || Date.parse(b.createdAt) || 0;
      return bTime - aTime;
    })
    .slice(0, 5), [transactions]);



  return (
    <div className="mx-auto max-w-[1160px] space-y-4 pb-2 animate-page select-text">
      <DashboardHero selectedMonth={selectedMonth} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: t.incomeThisMonth, value: monthSummary.income, color: 'text-positive', route: 'income' as const },
          { label: t.expensesThisMonth, value: monthSummary.expenses, color: 'text-negative', route: 'expenses' as const },
          { label: language === 'ar' ? 'الصافي' : language === 'fr' ? 'Net' : 'Net', value: monthSummary.net, color: monthSummary.net >= 0 ? 'text-positive' : 'text-negative', route: 'history' as const },
        ].map((stat) => (
          <button key={stat.label} type="button" onClick={() => setActiveScreen(stat.route)} className="min-w-0 rounded-control border border-border-subtle bg-surface px-3 py-2.5 text-start hover:bg-surface-raised">
            <span className="block text-xs text-muted">{stat.label}</span>
            <MoneyText amount={stat.value} showSign className={`mt-1 text-lg font-semibold ${stat.color}`} />
          </button>
        ))}
      </div>

      {pinnedNote && (
        <button type="button" onClick={() => setActiveScreen('notes')} className="flex min-h-11 w-full items-center gap-2 overflow-hidden whitespace-nowrap rounded-control border border-amber-500/25 bg-amber-500/10 px-3 text-start text-sm text-content">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
          <span className="min-w-0 truncate font-semibold">{pinnedNote.title}</span>
          {pinnedNote.content && <span className="hidden min-w-0 truncate text-muted sm:inline">· {pinnedNote.content}</span>}
        </button>
      )}

      <button type="button" onClick={() => setActiveScreen('tasks')} className="flex min-h-11 w-full items-center justify-between rounded-control border border-border-subtle bg-surface px-3 text-sm text-content hover:bg-surface-raised">
        <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-accent" />{t.todayTasks}</span>
        <span className="font-semibold tabular-nums">{doneToday}/{activeTasks.length} <span aria-hidden="true">→</span></span>
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-content">{t.spendingBreakdown}</h2><span className="text-xs text-muted">{formatMonthYear(selectedMonth, language)}</span></div>
          {categoryTotals.length ? categoryTotals.map(({ category, spent }) => {
            const Icon = getCategoryIcon(category.icon);
            const budget = Number(category.monthlyBudget) || 0;
            const progress = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            const bar = spent > budget && budget > 0 ? 'bg-negative' : progress >= 80 ? 'bg-amber-500' : 'bg-accent';
            return (
              <div key={category.id} className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-content">{getCategoryName(category, language)}</span>
                  <MoneyText amount={spent} className="font-semibold text-content" />
                  {budget > 0 && <span className="text-muted">/ <MoneyText amount={budget} /></span>}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised" role="progressbar" aria-valuemin={0} aria-valuemax={budget || 100} aria-valuenow={budget ? Math.min(spent, budget) : 0} aria-label={`${getCategoryName(category, language)} ${t.budget}`}>
                  <div className={`h-full rounded-full ${budget > 0 ? bar : 'bg-border-subtle'}`} style={{ width: `${budget > 0 ? progress : 0}%` }} />
                </div>
                {budget <= 0 && <span className="text-[10px] text-muted">{t.noBudget}</span>}
              </div>
            );
          }) : <p className="text-xs text-muted">{t.noBudgetedCategories}</p>}
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-content">{t.nextBills}</h2><button type="button" onClick={() => setActiveScreen('subscriptions')} className="text-xs font-medium text-accent">{translations[language].nav.subscriptions} →</button></div>
          {upcomingBills.length ? upcomingBills.map(({ subscription, days, dueDate }) => (
            <div key={subscription.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-border-subtle pb-2 last:border-0 last:pb-0">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-content">{subscription.name}</p><p className="text-xs text-muted">{days < 0 ? t.overdue : days === 0 ? t.dueToday : t.inDays.replace('{count}', String(days))} · {dueDate}</p></div>
              <MoneyText amount={subscription.amount} className="shrink-0 text-sm font-semibold text-content" />
            </div>
          )) : <p className="text-xs text-muted">{t.noUpcomingBills}</p>}
        </Card>
      </div>

      <Card padding="md" className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-content"><Receipt className="h-4 w-4 text-accent" />{t.recentTransactions}</h2><button type="button" onClick={() => setActiveScreen('history')} className="text-xs font-medium text-accent">{t.seeAllTransactions} →</button></div>
        {recentTransactions.length ? <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">{recentTransactions.map((transaction: Transaction) => <TransactionItem key={transaction.id} transaction={transaction} hideBalance={hideBalance} />)}</div> : <p className="py-2 text-xs text-muted">{t.noTransactions}</p>}
      </Card>

    </div>
  );
};
