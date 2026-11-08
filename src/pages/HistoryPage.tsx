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
import { PrivacyCurrency } from '../components/common/PrivacyCurrency';

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

  // Calculate filtered totals (adjustments excluded from income and expense aggregates)
  const totalIn = filteredTransactions
    .filter((tx: Transaction) => tx.type === 'income' || tx.type === 'goal_withdraw')
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  const totalOut = filteredTransactions
    .filter((tx: Transaction) => tx.type === 'expense' || tx.type === 'contribution')
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  const totalAdj = filteredTransactions
    .filter((tx: Transaction) => tx.type === 'adjustment')
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  const netTotal = totalIn - totalOut + totalAdj;

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
          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">
            {t.totalIn}
          </span>
          <PrivacyCurrency
            amount={totalIn}
            showSign={true}
            className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block"
          />
        </Card>

        <Card padding="sm" className="text-left">
          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">
            {t.totalOut}
          </span>
          <PrivacyCurrency
            amount={totalOut}
            prefix="-"
            className="text-sm sm:text-base font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block"
          />
        </Card>

        <Card padding="sm" className="text-left">
          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">
            {t.netTotal}
          </span>
          <PrivacyCurrency
            amount={netTotal}
            className={`text-sm sm:text-base font-semibold mt-0.5 block ${
              netTotal >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <div className="space-y-3 bg-white dark:bg-[#202020] p-3.5 rounded-lg border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#787774] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:outline-none focus:border-[#2383e2]"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-[#f1f0ee] dark:bg-[#282828] rounded-md overflow-x-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] font-medium shadow-xs'
                  : 'text-[#787774] dark:text-[#9b9a97]'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                typeFilter === 'expense'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium'
                  : 'text-[#787774] dark:text-[#9b9a97]'
              }`}
            >
              {t.filterExpenses}
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                typeFilter === 'income'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium'
                  : 'text-[#787774] dark:text-[#9b9a97]'
              }`}
            >
              {t.filterIncome}
            </button>
            <button
              onClick={() => setTypeFilter('contribution')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                typeFilter === 'contribution'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                  : 'text-[#787774] dark:text-[#9b9a97]'
              }`}
            >
              {t.filterSavings}
            </button>
            <button
              onClick={() => setTypeFilter('adjustment')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                typeFilter === 'adjustment'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-medium'
                  : 'text-[#787774] dark:text-[#9b9a97]'
              }`}
            >
              {t.filterAdjustments}
            </button>
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
          >
            <option value="all">{t.allDates}</option>
            {availableMonths.map((m: string) => (
              <option key={m} value={m}>
                {formatMonthYear(m, language)}
              </option>
            ))}
          </select>

          {/* Category / Source Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none max-w-[160px] truncate"
          >
            <option value="all">{t.allCategories}</option>
            <optgroup label="Catégories">
              {categories.map((c: Category) => (
                <option key={c.id} value={c.id}>
                  {getCategoryName(c, language)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Sources de revenus">
              {incomeSources.map((s: IncomeSource) => (
                <option key={s.id} value={s.id}>
                  {getIncomeSourceName(s, language)}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Reset Filters button if any is active */}
          {(search || typeFilter !== 'all' || selectedMonth !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setSelectedMonth('all');
                setSelectedCategory('all');
              }}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* Grouped Transactions List */}
      {sortedDates.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-5 h-5" />}
          title={t.noTransactionsFound}
          description="Aucune transaction ne correspond à vos filtres actuels."
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
                  <span className="text-[11px] text-slate-400">
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
