import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { MoneyText } from '../common/PrivacyCurrency';
import { Category, Language, Transaction } from '../../types';
import { getCategoryName } from '../../utils/i18nHelpers';
import { getCategoryIcon } from '../../utils/icons';
import { getCategoryVisualColor } from '../../utils/categoryColor';
import { isTransactionInMonth } from '../../utils/formatters';
import { translations } from '../../i18n/translations';

interface Props {
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: string;
  totalExpense: number;
  language: Language;
  onOpenBudgets: () => void;
}

export const DashboardSpendingCard: React.FC<Props> = ({ categories, transactions, selectedMonth, totalExpense, language, onOpenBudgets }) => {
  const t = translations[language].dashboard;
  const [mode, setMode] = useState<'spending' | 'budget'>(categories.some((category) => Number(category.monthlyBudget) > 0) ? 'budget' : 'spending');
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense' || !transaction.categoryId || !isTransactionInMonth(transaction.date, selectedMonth)) return;
      map.set(transaction.categoryId, (map.get(transaction.categoryId) || 0) + Number(transaction.amount || 0));
    });
    return categories
      .filter((category) => !category.isArchived && !category.isGoal && (map.get(category.id) || 0) > 0)
      .map((category) => ({ category, spent: map.get(category.id) || 0, budget: Number(category.monthlyBudget) || 0 }))
      .sort((a, b) => b.spent - a.spent);
  }, [categories, transactions, selectedMonth]);
  const budgetTotals = categories.filter((category) => !category.isArchived && !category.isGoal && Number(category.monthlyBudget) > 0)
    .map((category) => ({ category, spent: transactions.reduce((sum, transaction) => sum + (transaction.type === 'expense' && transaction.categoryId === category.id && isTransactionInMonth(transaction.date, selectedMonth) ? Number(transaction.amount) || 0 : 0), 0), budget: Number(category.monthlyBudget) || 0 }));
  const hasBudgets = budgetTotals.length > 0;
  const top = totals.slice(0, 4);
  const topCategoryTotal = top.reduce((sum, item) => sum + item.spent, 0);
  const otherTotal = Math.max(0, totalExpense - topCategoryTotal);
  const sections = [...top.map((item) => ({ ...item, color: getCategoryVisualColor(item.category.id) })), ...(otherTotal > 0 ? [{ category: null, spent: otherTotal, budget: 0, color: '#888A91' }] : [])];
  const budgetLeaders = budgetTotals
    .sort((a, b) => (b.spent / b.budget) - (a.spent / a.budget))
    .slice(0, 3);

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold text-content">{t.spendingTitle}</h2>
          <MoneyText amount={totalExpense} className="text-xs font-semibold text-content" />
        </div>
        <button type="button" onClick={onOpenBudgets} className="inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-xs font-medium text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t.setBudgets}<ArrowRight aria-hidden="true" className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} /></button>
      </div>

      {hasBudgets && <div role="group" aria-label={t.spendingTitle} className="flex w-fit rounded-control border border-border-subtle bg-surface-raised p-0.5">
        {(['spending', 'budget'] as const).map((entry) => <button key={entry} type="button" aria-pressed={mode === entry} onClick={() => setMode(entry)} className={`min-h-11 rounded-control px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${mode === entry ? 'bg-surface text-content shadow-sm' : 'text-muted hover:text-content'}`}>{entry === 'spending' ? t.spendingMode : t.budgetMode}</button>)}
      </div>}

      {mode === 'budget' && hasBudgets ? <div className="space-y-3">
        {budgetLeaders.length ? budgetLeaders.map(({ category, spent, budget }) => {
          const progress = budget > 0 ? spent / budget * 100 : 0;
          const tone = progress > 100 ? 'bg-negative' : progress >= 80 ? 'bg-amber-500' : 'bg-accent';
          const Icon = getCategoryIcon(category.icon);
          return <div key={category.id} className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} style={{ color: getCategoryVisualColor(category.id) }} />
              <span className="min-w-0 flex-1 truncate text-content" title={getCategoryName(category, language)}>{getCategoryName(category, language)}</span>
              <MoneyText amount={spent} className="font-medium text-content" /><span className="text-muted">/ <MoneyText amount={budget} /></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-raised" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(progress))} aria-label={`${getCategoryName(category, language)} ${t.budget}`}>
              <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>;
        }) : <p className="text-xs text-muted">{t.noBudgets}</p>}
      </div> : totalExpense > 0 ? <div className="space-y-3">
        <div role="img" aria-label={t.spendingTitle} className="flex h-2.5 overflow-hidden rounded-full bg-surface-raised">
          {sections.map(({ category, spent, color }, index) => <span key={category?.id || `other-${index}`} style={{ width: `${Math.max(0, spent / totalExpense * 100)}%`, backgroundColor: color }} />)}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {sections.map(({ category, spent, color }, index) => <div key={category?.id || `other-${index}`} className="flex min-w-0 items-center gap-1.5 text-xs">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="max-w-32 truncate text-muted" title={category ? getCategoryName(category, language) : t.otherCategory}>{category ? getCategoryName(category, language) : t.otherCategory}</span>
            <MoneyText amount={spent} className="font-medium text-content" />
          </div>)}
        </div>
      </div> : <p className="flex min-h-11 items-center text-xs text-muted">{t.noExpensesThisMonth}</p>}
    </Card>
  );
};
