import React from 'react';
import { ArrowRight, SlidersHorizontal, Wallet } from 'lucide-react';
import { MoneyText } from '../common/PrivacyCurrency';
import { Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getCategoryIcon } from '../../utils/icons';
import { getCategoryVisualColor } from '../../utils/categoryColor';
import { formatDate } from '../../utils/formatters';
import {
  getCategoryName,
  getIncomeSourceName,
  getSubCategoryName,
  translateCategoryText,
} from '../../utils/i18nHelpers';
import { translations } from '../../i18n/translations';

interface Props {
  transactions: Transaction[];
  onViewAll: () => void;
}

export const DashboardRecentTransactions: React.FC<Props> = ({
  transactions = [],
  onViewAll,
}) => {
  const { categories = [], incomeSources = [], language, setActiveScreen } = useAppStore();
  const t = translations[language].dashboard;
  const recent = (transactions || []).slice(0, 5);

  return (
    <div
      data-spotlight="true"
      className="spotlight-card rounded-2xl bg-surface dark:bg-surface-3/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-border-subtle/10 shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] space-y-3.5 h-fit w-full min-w-0"
    >
      {/* Header: sentence case title + view all */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <h2 className="text-[15px] sm:text-base font-semibold text-content dark:text-content truncate">
          {t.recentTransactions}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
        >
          <span>{t.seeAllTransactions}</span>
          <ArrowRight aria-hidden="true" className="h-3 w-3 rtl:rotate-180" />
        </button>
      </div>

      {recent.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 min-w-0">
          {recent.map((transaction) => {
            const category = categories.find((item) => item.id === transaction.categoryId);
            const source = incomeSources.find((item) => item.id === transaction.sourceId);
            const subcategory = category?.subcategories?.find(
              (item) => item.id === transaction.subCategoryId
            );
            const categoryLabel = category
              ? getCategoryName(category, language)
              : source
              ? getIncomeSourceName(source, language)
              : '';
            const subLabel = subcategory
              ? getSubCategoryName(subcategory, language)
              : transaction.subCategoryId
              ? translateCategoryText(transaction.subCategoryId, language)
              : '';
            const note = transaction.note
              ? translateCategoryText(transaction.note, language) || transaction.note
              : '';
            const title =
              note ||
              subLabel ||
              categoryLabel ||
              (transaction.type === 'adjustment'
                ? translations[language].summaryScopes.adjustment
                : t.recentTransactions);
            const isAdjustment = transaction.type === 'adjustment';
            const isIncome =
              transaction.type === 'income' || transaction.type === 'goal_withdraw';
            const icon = isAdjustment
              ? SlidersHorizontal
              : transaction.type === 'income'
              ? getCategoryIcon(source?.icon || 'Wallet')
              : transaction.type === 'goal_withdraw'
              ? Wallet
              : getCategoryIcon(category?.icon || 'Wallet');
            const Icon = icon;
            const color = isAdjustment
              ? 'var(--info)'
              : isIncome
              ? 'var(--positive)'
              : transaction.type === 'contribution'
              ? 'var(--info)'
              : getCategoryVisualColor(category?.id);
            const prefix = isAdjustment
              ? transaction.amount >= 0
                ? '+ '
                : '− '
              : isIncome
              ? '+ '
              : '− ';
            const amount = isAdjustment ? Math.abs(transaction.amount) : transaction.amount;
            const shortRelativeDate = formatDate(transaction.date, language);
            const parentLabel =
              categoryLabel || translations[language].common[source ? 'source' : 'category'];
            const subtitle = `${parentLabel} · ${shortRelativeDate}`;

            return (
              <button
                key={transaction.id}
                type="button"
                onClick={() => setActiveScreen('history')}
                className="flex w-full min-w-0 items-center justify-between gap-3 p-3 rounded-xl bg-surface-raised/60 dark:bg-surface-3/5 border border-border-subtle dark:border-border-subtle/10 hover:bg-surface-raised dark:hover:bg-surface-3/5 transition-all group active:scale-[0.98] duration-200 cursor-pointer"
              >
                {/* Category Icon */}
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>

                {/* Title (wraps up to 2 lines) & Subtitle (Category · Short date, no time) */}
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="line-clamp-2 text-xs sm:text-sm font-semibold text-content dark:text-content leading-snug"
                      title={title}
                    >
                      {title}
                    </span>
                    {isAdjustment && (
                      <span
                        title={t.adjustmentTooltip}
                        className="shrink-0 whitespace-nowrap rounded-full border border-indigo-400/25 bg-indigo-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-500 dark:text-indigo-300"
                      >
                        {t.adjustmentLabel}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted dark:text-zinc-400">
                    {subtitle}
                  </span>
                </span>

                {/* Amount (never clipped) */}
                <span className="shrink-0 whitespace-nowrap text-end ps-2">
                  <MoneyText
                    amount={amount}
                    prefix={prefix}
                    className={`shrink-0 whitespace-nowrap text-xs sm:text-sm font-bold tabular-nums ${
                      isAdjustment
                        ? 'text-indigo-500 dark:text-indigo-300'
                        : isIncome
                        ? 'text-positive'
                        : 'text-negative'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="flex min-h-11 items-center text-xs text-muted dark:text-zinc-400">
          {t.noTransactions}
        </p>
      )}
    </div>
  );
};
