import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { MoneyText } from '../common/PrivacyCurrency';
import { Category, Language, Transaction } from '../../types';
import { getCategoryName } from '../../utils/i18nHelpers';
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

export const DashboardSpendingCard: React.FC<Props> = ({
  categories = [],
  transactions = [],
  selectedMonth,
  totalExpense,
  language,
  onOpenBudgets,
}) => {
  const t = translations[language].dashboard;
  const catList = categories || [];
  const txList = transactions || [];

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    txList.forEach((transaction) => {
      if (
        transaction.type !== 'expense' ||
        !transaction.categoryId ||
        !isTransactionInMonth(transaction.date, selectedMonth)
      )
        return;
      map.set(
        transaction.categoryId,
        (map.get(transaction.categoryId) || 0) + Number(transaction.amount || 0)
      );
    });
    return catList
      .filter((category) => !category.isArchived && !category.isGoal && (map.get(category.id) || 0) > 0)
      .map((category) => ({
        category,
        spent: map.get(category.id) || 0,
        budget: Number(category.monthlyBudget) || 0,
      }))
      .sort((a, b) => b.spent - a.spent);
  }, [catList, txList, selectedMonth]);

  const top = totals.slice(0, 4);
  const topCategoryTotal = top.reduce((sum, item) => sum + item.spent, 0);
  const otherTotal = Math.max(0, totalExpense - topCategoryTotal);
  const sections = [
    ...top.map((item) => ({ ...item, color: getCategoryVisualColor(item.category.id) })),
    ...(otherTotal > 0 ? [{ category: null, spent: otherTotal, budget: 0, color: 'var(--text-muted)' }] : []),
  ];

  return (
    <div
      data-spotlight="true"
      className="spotlight-card rounded-2xl bg-surface dark:bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-white/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] flex flex-col justify-between gap-3 min-w-0"
    >
      {/* Title + total + "Set budgets" (sentence case, 15-17px, font-semibold) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-[15px] sm:text-base font-semibold text-content dark:text-white truncate">
            {t.spendingTitle}
          </h2>
          <span className="text-muted dark:text-zinc-500">·</span>
          <MoneyText
            amount={totalExpense}
            className="text-sm sm:text-[15px] font-bold text-content dark:text-white tabular-nums shrink-0"
          />
        </div>
        <button
          type="button"
          onClick={onOpenBudgets}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
        >
          <span>{t.setBudgets}</span>
          <ArrowRight aria-hidden="true" className="h-3 w-3 rtl:rotate-180" />
        </button>
      </div>

      {totalExpense > 0 ? (
        <div className="space-y-3 min-w-0">
          {/* Stacked Horizontal Bar */}
          <div
            role="img"
            aria-label={t.spendingTitle}
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-raised dark:bg-white/[0.06] p-0.5 gap-0.5"
          >
            {sections.map(({ category, spent, color }, index) => (
              <span
                key={category?.id || `other-${index}`}
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(1, (spent / totalExpense) * 100)}%`,
                  backgroundColor: color,
                }}
              />
            ))}
          </div>

          {/* Wrapped inline legend (dot + name + amount) in 2 columns, not stacked pills */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs min-w-0">
            {sections.map(({ category, spent, color }, index) => (
              <div key={category?.id || `other-${index}`} className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="truncate text-xs text-muted dark:text-zinc-300"
                    title={category ? getCategoryName(category, language) : t.otherCategory}
                  >
                    {category ? getCategoryName(category, language) : t.otherCategory}
                  </span>
                </div>
                <MoneyText
                  amount={spent}
                  className="font-medium text-content dark:text-zinc-100 tabular-nums shrink-0 text-end"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="flex min-h-8 items-center text-xs text-muted dark:text-zinc-400">
          {t.noExpensesThisMonth}
        </p>
      )}
    </div>
  );
};
