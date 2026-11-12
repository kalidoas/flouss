import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatMAD, formatDate, formatMonthYear, isTransactionInMonth, getTransactionMonth } from '../utils/formatters';
import { translations } from '../i18n/translations';
import { Category, IncomeSource, Transaction } from '../types';
import {
  getCategoryName,
  getSubCategoryName,
  getIncomeSourceName,
  getIncomeSubSourceName,
} from '../utils/i18nHelpers';
import { exportToExcel } from '../utils/excelExport';
import { Search, RotateCcw, FileSpreadsheet, Receipt } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { MoneyText } from '../components/common/PrivacyCurrency';
import { selectFinancialSummary } from '../utils/calculations';
import { StyledSelect } from '../components/common/StyledSelect';

export const HistoryPage: React.FC = () => {
  const { initialBalance = null, transactions = [], categories = [], incomeSources = [], hideBalance, language } = useAppStore();
  const txList = transactions || [];
  const catList = categories || [];
  const srcList = incomeSources || [];
  const t = translations[language].history;

  const handleExportExcel = () => {
    exportToExcel({
      initialBalance,
      transactions: txList,
      categories: catList,
      incomeSources: srcList,
      language,
    });
  };

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'contribution' | 'adjustment'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Month list
  const availableMonths: string[] = Array.from(
    new Set(txList.map((tx: Transaction) => getTransactionMonth(tx?.date)))
  ).filter(Boolean).sort((a: string, b: string) => b.localeCompare(a));

  // Filter transactions
  const filteredTransactions = txList.filter((tx: Transaction) => {
    // Type filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Month filter
    if (selectedMonth !== 'all' && !isTransactionInMonth(tx.date, selectedMonth)) return false;

    // Category / Source filter
    if (selectedCategory !== 'all') {
      if (tx.categoryId !== selectedCategory && tx.sourceId !== selectedCategory) {
        return false;
      }
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const cat = catList.find((c: Category) => c.id === tx.categoryId);
      const subCat = cat?.subcategories?.find((s) => s.id === tx.subCategoryId);
      const src = srcList.find((s: IncomeSource) => s.id === tx.sourceId);
      const subSrc = src?.subcategories?.find((s) => s.id === tx.incomeSubSourceId);

      const matchNote = tx.note?.toLowerCase().includes(q) ?? false;
      const matchCat = cat ? getCategoryName(cat, language).toLowerCase().includes(q) : false;
      const matchSubCat = subCat ? getSubCategoryName(subCat, language).toLowerCase().includes(q) : false;
      const matchSrc = src ? getIncomeSourceName(src, language).toLowerCase().includes(q) : false;
      const matchSubSrc = subSrc ? getIncomeSubSourceName(subSrc, language).toLowerCase().includes(q) : false;
      const matchAmount = tx.amount.toString().includes(q);

      if (!matchNote && !matchCat && !matchSubCat && !matchSrc && !matchSubSrc && !matchAmount) {
        return false;
      }
    }

    return true;
  });

  // In/out include goal transfers; adjustments affect net only.
  const filteredSummary = selectFinancialSummary(filteredTransactions);
  const totalIn = filteredSummary.totalIn;
  const totalOut = filteredSummary.totalOut;
  const totalAdj = filteredSummary.adjustments;
  const netTotal = filteredSummary.net;

  // Group by date (day string YYYY-MM-DD)
  const groupedTransactions: { [dateStr: string]: Transaction[] } = {};
  filteredTransactions.forEach((tx: Transaction) => {
    const dayKey = tx.date.substring(0, 10);
    if (!groupedTransactions[dayKey]) {
      groupedTransactions[dayKey] = [];
    }
    groupedTransactions[dayKey].push(tx);
  });

  // Sorted dates descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-[1280px] mx-auto space-y-5 animate-page select-text pb-8">
      {/* Page Title & Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.08] hover:border-emerald-500/30 text-zinc-200 hover:text-emerald-300 px-4 py-2 text-xs font-semibold backdrop-blur-md transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>{language === 'ar' ? 'تصدير إلى Excel' : language === 'en' ? 'Export to Excel' : 'Exporter Excel (.xlsx)'}</span>
        </button>
      </div>

      {/* 3-Column Bento Metric Bar with Subtle Radial Corner Glows */}
      <div className="rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] rtl:sm:divide-x-reverse gap-y-4 sm:gap-y-0">
          {/* Total In */}
          <div className="sm:px-4 first:ps-0 last:pe-0">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block truncate">
              {t.totalIn}
            </span>
            <MoneyText
              amount={totalIn}
              showSign={true}
              className="mt-2 block max-w-full truncate text-2xl font-bold tracking-tight tabular-nums text-emerald-400"
            />
          </div>

          {/* Total Out */}
          <div className="pt-3 sm:pt-0 sm:px-4 first:ps-0 last:pe-0">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block truncate">
              {t.totalOut}
            </span>
            <MoneyText
              amount={totalOut}
              prefix="− "
              className="mt-2 block max-w-full truncate text-2xl font-bold tracking-tight tabular-nums text-rose-400"
            />
          </div>

          {/* Net Total */}
          <div className="pt-3 sm:pt-0 sm:px-4 first:ps-0 last:pe-0">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block truncate">
              {t.netTotal}
            </span>
            <MoneyText
              amount={netTotal}
              className={`mt-2 block max-w-full truncate text-2xl font-bold tracking-tight tabular-nums ${
                netTotal >= 0
                  ? 'text-indigo-300'
                  : 'text-rose-400'
              }`}
            />
          </div>
        </div>

        <p className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] text-zinc-500">
          {translations[language].summaryScopes.history}
        </p>
      </div>

      {/* Unified Filter Bar (Single Horizontal Glass Container) */}
      <div className="relative z-50 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 shadow-xl space-y-2.5">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full text-xs ps-8 pe-3 py-1.5 rounded-full border border-white/[0.08] bg-black/40 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Month Selector & Category Selector */}
          <div className="flex items-center gap-2 flex-wrap relative z-50">
            <StyledSelect label={t.allDates} value={selectedMonth} onChange={setSelectedMonth} className="min-w-32" options={[
              { value: 'all', label: t.allDates },
              ...availableMonths.map((m: string) => ({ value: m, label: formatMonthYear(m, language) })),
            ]} />

            <StyledSelect label={t.allCategories} value={selectedCategory} onChange={setSelectedCategory} className="min-w-36 max-w-52" options={[
              { value: 'all', label: t.allCategories },
              ...categories.map((c: Category) => ({ value: c.id, label: getCategoryName(c, language) })),
              ...incomeSources.map((s: IncomeSource) => ({ value: s.id, label: getIncomeSourceName(s, language) })),
            ]} />

            {/* Reset Filters button if any is active */}
            {(search || typeFilter !== 'all' || selectedMonth !== 'all' || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setSelectedMonth('all');
                  setSelectedCategory('all');
                }}
                className="min-h-8 px-3 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 font-medium flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ar' ? 'مسح الفلاتر' : language === 'en' ? 'Clear' : 'Effacer'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Type Filter Pills Row */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-full overflow-x-auto scrollbar-none border border-white/[0.06]">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
              typeFilter === 'all'
                ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.filterAll}
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
              typeFilter === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.filterExpenses}
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
              typeFilter === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.filterIncome}
          </button>
          <button
            onClick={() => setTypeFilter('contribution')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
              typeFilter === 'contribution'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.filterSavings}
          </button>
          <button
            onClick={() => setTypeFilter('adjustment')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
              typeFilter === 'adjustment'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.filterAdjustments}
          </button>
        </div>
      </div>

      {/* Date-Grouped Financial Ledger List */}
      {sortedDates.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <EmptyState
            icon={<Receipt className="w-6 h-6 text-indigo-400" />}
            title={t.noTransactionsFound}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateStr) => {
            const dayTransactions = groupedTransactions[dateStr];
            const todayKey = new Date().toISOString().slice(0, 10);
            const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            let dateLabel = formatDate(dateStr, language);
            if (dateStr === todayKey) {
              dateLabel = language === 'ar' ? 'اليوم' : language === 'fr' ? "Aujourd'hui" : 'Today';
            } else if (dateStr === yesterdayKey) {
              dateLabel = language === 'ar' ? 'أمس' : language === 'fr' ? 'Hier' : 'Yesterday';
            }

            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    {dateLabel}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {dayTransactions.length} {language === 'ar' ? 'معاملات' : 'transaction(s)'}
                  </span>
                </div>

                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 divide-y divide-white/[0.05] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  {dayTransactions.map((tx: Transaction) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      hideBalance={hideBalance}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
