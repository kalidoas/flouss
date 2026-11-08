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
  const { initialBalance, transactions, categories, incomeSources, hideBalance, language } = useAppStore();
  const t = translations[language].history;

  const handleExportExcel = () => {
    exportToExcel({
      initialBalance,
      transactions,
      categories,
      incomeSources,
      language,
    });
  };

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'contribution' | 'adjustment'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Month list
  const availableMonths: string[] = Array.from(
    new Set(transactions.map((tx: Transaction) => getTransactionMonth(tx.date)))
  ).filter(Boolean).sort((a: string, b: string) => b.localeCompare(a));

  // Filter transactions
  const filteredTransactions = transactions.filter((tx: Transaction) => {
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
      const cat = categories.find((c: Category) => c.id === tx.categoryId);
      const subCat = cat?.subcategories?.find((s) => s.id === tx.subCategoryId);
      const src = incomeSources.find((s: IncomeSource) => s.id === tx.sourceId);
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
    <div className="max-w-[1200px] mx-auto space-y-6 sm:space-y-8 animate-page">
      {/* Page Title & Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
        >
          {language === 'ar' ? 'تصدير إلى Excel' : language === 'en' ? 'Export to Excel' : 'Exporter Excel (.xlsx)'}
        </Button>
      </div>

      {/* KPI Strip for the filtered set */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-left">
          <span className="text-caption text-muted uppercase tracking-wider block">
            {t.totalIn}
          </span>
          <MoneyText
            amount={totalIn}
            showSign={true}
            className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block"
          />
        </Card>

        <Card padding="sm" className="text-left">
          <span className="text-caption text-muted uppercase tracking-wider block">
            {t.totalOut}
          </span>
          <MoneyText
            amount={totalOut}
            prefix="-"
            className="text-sm sm:text-base font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block"
          />
        </Card>

        <Card padding="sm" className="text-left">
          <span className="text-caption text-muted uppercase tracking-wider block">
            {t.netTotal}
          </span>
          <MoneyText
            amount={netTotal}
            className={`text-sm sm:text-base font-semibold mt-0.5 block ${
              netTotal >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </Card>
      </div>

      <p className="-mt-4 text-xs leading-relaxed text-muted whitespace-normal break-words">
        {translations[language].summaryScopes.history}
      </p>

      {/* Search & Filters Bar */}
      <div className="space-y-3 bg-surface p-3.5 rounded-control border border-border-subtle shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="min-h-11 w-full text-xs ps-8 pe-3 py-1.5 rounded-control border border-border-subtle bg-canvas text-content focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-surface-raised rounded-control overflow-x-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`min-h-11 px-3 rounded-control text-xs transition-colors ${
                typeFilter === 'all'
                  ? 'bg-surface text-content font-medium shadow-xs'
                  : 'text-muted'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`min-h-11 px-3 rounded-control text-xs transition-colors ${
                typeFilter === 'expense'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium'
                  : 'text-muted'
              }`}
            >
              {t.filterExpenses}
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`min-h-11 px-3 rounded-control text-xs transition-colors ${
                typeFilter === 'income'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium'
                  : 'text-muted'
              }`}
            >
              {t.filterIncome}
            </button>
            <button
              onClick={() => setTypeFilter('contribution')}
              className={`min-h-11 px-3 rounded-control text-xs transition-colors ${
                typeFilter === 'contribution'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                  : 'text-muted'
              }`}
            >
              {t.filterSavings}
            </button>
            <button
              onClick={() => setTypeFilter('adjustment')}
              className={`min-h-11 px-3 rounded-control text-xs transition-colors ${
                typeFilter === 'adjustment'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-medium'
                  : 'text-muted'
              }`}
            >
              {t.filterAdjustments}
            </button>
          </div>

          {/* Month Selector */}
          <StyledSelect label={t.allDates} value={selectedMonth} onChange={setSelectedMonth} className="min-w-36" options={[
            { value: 'all', label: t.allDates },
            ...availableMonths.map((m: string) => ({ value: m, label: formatMonthYear(m, language) })),
          ]} />

          {/* Category / Source Selector */}
          <StyledSelect label={t.allCategories} value={selectedCategory} onChange={setSelectedCategory} className="min-w-40 max-w-52" options={[
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
              className="min-h-11 px-3 text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> {language === 'ar' ? 'مسح الفلاتر' : language === 'en' ? 'Clear filters' : 'Effacer les filtres'}
            </button>
          )}
        </div>
      </div>

      {/* Grouped Transactions List */}
      {sortedDates.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-5 h-5" />}
          title={t.noTransactionsFound}
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dayTransactions = groupedTransactions[dateStr];
            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {formatDate(dateStr, language)}
                  </h3>
                  <span className="text-caption text-slate-400">
                    {dayTransactions.length} transaction(s)
                  </span>
                </div>

                <div className="space-y-2">
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
