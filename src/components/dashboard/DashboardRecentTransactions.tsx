import React from 'react';
import { SlidersHorizontal, Wallet } from 'lucide-react';
import { Card } from '../common/Card';
import { MoneyText } from '../common/PrivacyCurrency';
import { Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getCategoryIcon } from '../../utils/icons';
import { getCategoryVisualColor } from '../../utils/categoryColor';
import { formatDateTime } from '../../utils/formatters';
import { getCategoryName, getIncomeSourceName, getSubCategoryName, translateCategoryText } from '../../utils/i18nHelpers';
import { translations } from '../../i18n/translations';

interface Props { transactions: Transaction[]; onViewAll: () => void; }

export const DashboardRecentTransactions: React.FC<Props> = ({ transactions, onViewAll }) => {
  const { categories, incomeSources, language, setActiveScreen } = useAppStore();
  const t = translations[language].dashboard;
  const recent = transactions.slice(0, 5);

  return <Card padding="md" className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-content">{t.recentTransactions}</h2>
      <button type="button" onClick={onViewAll} className="inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-xs font-semibold text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t.seeAllTransactions}<span aria-hidden="true">→</span></button>
    </div>
    {recent.length ? <ul className="grid gap-2 xl:grid-cols-2">
      {recent.map((transaction) => {
        const category = categories.find((item) => item.id === transaction.categoryId);
        const source = incomeSources.find((item) => item.id === transaction.sourceId);
        const subcategory = category?.subcategories?.find((item) => item.id === transaction.subCategoryId);
        const categoryLabel = category ? getCategoryName(category, language) : source ? getIncomeSourceName(source, language) : '';
        const subLabel = subcategory ? getSubCategoryName(subcategory, language) : transaction.subCategoryId ? translateCategoryText(transaction.subCategoryId, language) : '';
        const note = transaction.note ? translateCategoryText(transaction.note, language) || transaction.note : '';
        const title = note || subLabel || categoryLabel || (transaction.type === 'adjustment' ? translations[language].summaryScopes.adjustment : t.recentTransactions);
        const isAdjustment = transaction.type === 'adjustment';
        const isIncome = transaction.type === 'income' || transaction.type === 'goal_withdraw';
        const icon = isAdjustment ? SlidersHorizontal : transaction.type === 'income' ? getCategoryIcon(source?.icon || 'Wallet') : transaction.type === 'goal_withdraw' ? Wallet : getCategoryIcon(category?.icon || 'Wallet');
        const Icon = icon;
        const color = isAdjustment ? '#0A84FF' : isIncome ? '#30D158' : transaction.type === 'contribution' ? '#0A84FF' : getCategoryVisualColor(category?.id);
        const prefix = isAdjustment ? (transaction.amount >= 0 ? '+ ' : '− ') : isIncome ? '+ ' : '− ';
        const amount = isAdjustment ? Math.abs(transaction.amount) : transaction.amount;
        return <li key={transaction.id}>
          <button type="button" onClick={() => setActiveScreen('history')} className="flex min-h-[68px] w-full min-w-0 items-center gap-3 rounded-control border border-border-subtle bg-surface px-3 py-2 text-start transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-control" style={{ backgroundColor: `${color}20`, color }}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-content" title={title}>{title}</span>
                {isAdjustment && <span title={t.adjustmentTooltip} className="shrink-0 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">{t.adjustmentLabel}</span>}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">{categoryLabel || translations[language].common[source ? 'source' : 'category']} · {formatDateTime(transaction.date, language)}</span>
            </span>
            <MoneyText amount={amount} prefix={prefix} className={`shrink-0 text-xs font-semibold ${isAdjustment ? 'text-accent' : isIncome ? 'text-positive' : 'text-negative'}`} />
          </button>
        </li>;
      })}
    </ul> : <p className="flex min-h-11 items-center text-xs text-muted">{t.noTransactions}</p>}
  </Card>;
};
