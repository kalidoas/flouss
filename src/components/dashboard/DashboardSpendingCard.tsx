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
    <div
      data-spotlight="true"
      className="spotlight-card flex flex-col justify-between gap-4 rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] h-fit"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">{t.spendingTitle}</p>
          <span className="text-zinc-600">·</span>
          <MoneyText amount={totalExpense} className="text-sm font-bold tabular-nums text-white" />
        </div>
        <button type="button" onClick={onOpenBudgets} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1 text-xs font-medium text-indigo-300 hover:text-white transition-all">{t.setBudgets}<ArrowRight aria-hidden="true" className={`h-3 w-3 ${language === 'ar' ? 'rotate-180' : ''}`} /></button>
      </div>

      {hasBudgets && <div role="group" aria-label={t.spendingTitle} className="flex w-fit rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5">
        {(['spending', 'budget'] as const).map((entry) => <button key={entry} type="button" aria-pressed={mode === entry} onClick={() => setMode(entry)} className={`min-h-7 rounded-full px-3 text-xs font-medium transition-all ${mode === entry ? 'bg-white text-zinc-950 font-semibold shadow-xs' : 'text-zinc-400 hover:text-white'}`}>{entry === 'spending' ? t.spendingMode : t.budgetMode}</button>)}
      </div>}

      {mode === 'budget' && hasBudgets ? <div className="space-y-3">
        {budgetLeaders.length ? budgetLeaders.map(({ category, spent, budget }) => {
          const progress = budget > 0 ? spent / budget * 100 : 0;
          const tone = progress > 100 ? 'bg-rose-500' : progress >= 80 ? 'bg-amber-500' : 'bg-indigo-500';
          const Icon = getCategoryIcon(category.icon);
          return <div key={category.id} className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} style={{ color: getCategoryVisualColor(category.id) }} />
              <span className="min-w-0 flex-1 truncate text-zinc-200" title={getCategoryName(category, language)}>{getCategoryName(category, language)}</span>
              <MoneyText amount={spent} className="font-semibold text-white tabular-nums" /><span className="text-zinc-500">/ <MoneyText amount={budget} /></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(progress))} aria-label={`${getCategoryName(category, language)} ${t.budget}`}>
              <div className={`h-full rounded-full transition-all duration-300 ${tone}`} style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>;
        }) : <p className="text-xs text-zinc-400">{t.noBudgets}</p>}
      </div> : totalExpense > 0 ? <div className="space-y-3.5">
        <div role="img" aria-label={t.spendingTitle} className="flex h-3 overflow-hidden rounded-full bg-white/[0.06] p-0.5 gap-0.5">
          {sections.map(({ category, spent, color }, index) => <span key={category?.id || `other-${index}`} className="h-full rounded-full transition-all" style={{ width: `${Math.max(1, spent / totalExpense * 100)}%`, backgroundColor: color }} />)}
        </div>
        <div className="flex flex-wrap gap-x-3.5 gap-y-2">
          {sections.map(({ category, spent, color }, index) => <div key={category?.id || `other-${index}`} className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 text-xs">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="max-w-28 truncate text-zinc-400" title={category ? getCategoryName(category, language) : t.otherCategory}>{category ? getCategoryName(category, language) : t.otherCategory}</span>
            <MoneyText amount={spent} className="font-semibold text-zinc-100 tabular-nums" />
          </div>)}
        </div>
      </div> : <p className="flex min-h-11 items-center text-xs text-zinc-400">{t.noExpensesThisMonth}</p>}
    </div>
  );
};
