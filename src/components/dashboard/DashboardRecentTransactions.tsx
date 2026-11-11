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

  return (
    <div
      data-spotlight="true"
      className="spotlight-card rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] space-y-4 h-fit w-full"
    >
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">{t.recentTransactions}</h2>
      <button type="button" onClick={onViewAll} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1 text-xs font-medium text-indigo-300 hover:text-white transition-all">{t.seeAllTransactions}<span aria-hidden="true">→</span></button>
    </div>
    {recent.length ? <div className="flex flex-col gap-3">
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
        const color = isAdjustment ? '#818cf8' : isIncome ? '#34d399' : transaction.type === 'contribution' ? '#60a5fa' : getCategoryVisualColor(category?.id);
        const prefix = isAdjustment ? (transaction.amount >= 0 ? '+ ' : '− ') : isIncome ? '+ ' : '− ';
        const amount = isAdjustment ? Math.abs(transaction.amount) : transaction.amount;
        return <div key={transaction.id} className="min-w-0">
          <button type="button" onClick={() => setActiveScreen('history')} className="flex w-full min-w-0 items-center justify-between gap-3.5 py-3 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.09] text-start transition-all group active:scale-95 duration-200">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105" style={{ backgroundColor: `${color}22`, color }}><Icon className="h-4 w-4" strokeWidth={2} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate text-xs sm:text-sm font-semibold text-zinc-100" title={title}>{title}</span>
                {isAdjustment && <span title={t.adjustmentTooltip} className="shrink-0 flex-shrink-0 whitespace-nowrap rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2 py-0.2 text-[10px] font-medium text-indigo-300">{t.adjustmentLabel}</span>}
              </span>
              <span className="mt-0.5 block min-w-0 truncate text-[11px] text-zinc-400">{categoryLabel || translations[language].common[source ? 'source' : 'category']} · {formatDateTime(transaction.date, language)}</span>
            </span>
            <span className="shrink-0 flex-shrink-0 whitespace-nowrap text-end">
              <MoneyText amount={amount} prefix={prefix} className={`shrink-0 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm font-bold tabular-nums ${isAdjustment ? 'text-indigo-300' : isIncome ? 'text-emerald-400' : 'text-rose-400'}`} />
            </span>
          </button>
        </div>;
      })}
    </div> : <p className="flex min-h-11 items-center text-xs text-zinc-400">{t.noTransactions}</p>}
    </div>
  );
};
