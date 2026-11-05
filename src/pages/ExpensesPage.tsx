import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PrivacyCurrency } from '../components/common/PrivacyCurrency';
import { AddExpenseModal } from '../components/transactions/AddExpenseModal';
import { translations } from '../i18n/translations';
import { formatMAD, formatDate, getCurrentMonthStr } from '../utils/formatters';
import { getCategoryIcon } from '../utils/icons';
import { getCategoryName, getSubCategoryName, translateCategoryText } from '../utils/i18nHelpers';
import { Transaction } from '../types';
import {
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Clock,
  Trash2,
  Receipt,
  Filter,
  ArrowDownRight,
  ShoppingBag,
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const {
    transactions,
    categories,
    deleteTransaction,
    addTransaction,
    showToast,
    language,
    hideBalance,
  } = useAppStore();

  const t = translations[language].expensesPage;
  const tNav = translations[language].nav;
  const tCommon = translations[language].common;

  const currentMonth = getCurrentMonthStr();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'month' | 'all'>('month');

  // Strictly filter only expense transactions
  const allExpenses = useMemo(() => {
    return (transactions || []).filter((tx) => tx.type === 'expense');
  }, [transactions]);
  const monthOptions = useMemo(() => {
    const months = new Set(allExpenses.map((tx) => tx.date.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)));
    months.add(currentMonth);
    const locale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US';
    return Array.from(months).sort((a, b) => b.localeCompare(a)).map((month) => ({
      value: month,
      label: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
      ),
    }));
  }, [allExpenses, currentMonth, language]);

  // Apply search, category, and month filters
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((tx) => {
      // Month scope filter
      if (viewScope === 'month' && !tx.date.startsWith(selectedMonth)) {
        return false;
      }

      // Category filter
      if (selectedCategoryId !== 'all' && tx.categoryId !== selectedCategoryId) {
        return false;
      }

      // Search query (note, category name, subcategory)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catName = cat ? getCategoryName(cat, language).toLowerCase() : '';
        const subCat = cat?.subcategories?.find((s) => s.id === tx.subCategoryId);
        const subCatName = subCat ? getSubCategoryName(subCat, language).toLowerCase() : '';
        const note = (tx.note || '').toLowerCase();

        return note.includes(q) || catName.includes(q) || subCatName.includes(q);
      }

      return true;
    });
  }, [allExpenses, viewScope, selectedMonth, selectedCategoryId, searchQuery, categories, language]);

  // Metrics calculations
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [filteredExpenses]);

  // Group filtered expenses by Date (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    filteredExpenses.forEach((tx) => {
      const dateKey = tx.date.slice(0, 10);
      const existing = groups.get(dateKey) || [];
      existing.push(tx);
      groups.set(dateKey, existing);
    });

    // Sort descending by date
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredExpenses]);

  const handleDelete = (tx: Transaction) => {
    deleteTransaction(tx.id);
    showToast({
      message:
        language === 'ar'
          ? 'تم حذف المصروف بنجاح'
          : language === 'en'
          ? 'Expense deleted'
          : 'Dépense supprimée',
      actionText: language === 'ar' ? 'تراجع' : language === 'en' ? 'Undo' : 'Annuler',
      onAction: () => {
        addTransaction(tx);
      },
    });
  };

  // Helper to extract exact time (HH:mm)
  const getExactTime = (dateStr: string, createdAt?: string): string => {
    if (dateStr.includes('T')) {
      return dateStr.split('T')[1].slice(0, 5);
    }
    if (createdAt && createdAt.includes('T')) {
      const timePart = createdAt.split('T')[1];
      return timePart ? timePart.slice(0, 5) : '12:00';
    }
    return '12:00';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 animate-page select-text pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4 stroke-[2.4]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {t.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4 stroke-[2.4]" />}
          onClick={() => setIsAddExpenseOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs self-start sm:self-auto"
        >
          {t.addExpense}
        </Button>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Expenses Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              {t.totalExpenses}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
              <PrivacyCurrency
                amount={totalExpenseAmount}
                prefix="-"
                className="font-extrabold text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Total Operations Count Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              {t.transactionsCount}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tabular-nums mt-0.5">
              {filteredExpenses.length}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Receipt className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Scope Toggle: This Month vs All Time */}
          <div className="flex flex-wrap items-center gap-2 self-start">
          <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] shrink-0">
            <button
              onClick={() => setViewScope('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewScope === 'month'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {t.filterThisMonth}
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewScope === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {t.filterAll}
            </button>
          </div>
          {viewScope === 'month' && (
            <label className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <select
                aria-label={language === 'ar' ? 'اختر الشهر' : language === 'fr' ? 'Choisir le mois' : 'Choose month'}
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="appearance-none pl-8 pr-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-black/[0.07] dark:border-white/[0.08] outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
              </select>
            </label>
          )}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border border-transparent focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{getCategoryName(cat, language)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date-Grouped Expenses List */}
      {groupedByDate.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] text-center">
          <EmptyState
            title={t.noExpensesFound}
            description={t.noExpensesYet}
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddExpenseOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {t.addExpense}
              </Button>
            }
            icon={<ShoppingBag className="w-8 h-8 text-rose-500" />}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(([dateKey, items]) => {
            const dayTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const dateLabel = formatDate(dateKey, language);

            return (
              <div key={dateKey} className="space-y-2.5">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {dateLabel}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      ({items.length})
                    </span>
                  </div>

                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    -{formatMAD(dayTotal, false, language)}
                  </span>
                </div>

                {/* Day's Expenses Cards */}
                <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.05] overflow-hidden shadow-xs">
                  {items.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    const subCat = cat?.subcategories?.find((s) => s.id === tx.subCategoryId);
                    const IconComp = cat ? getCategoryIcon(cat.icon) : ShoppingBag;
                    let catName = cat ? getCategoryName(cat, language) : '';
                    if (!catName) {
                      const rawCat = (tx as any).categoryName || (tx as any).category || tx.categoryId;
                      if (rawCat) catName = translateCategoryText(rawCat, language);
                    }
                    if (!catName) catName = tNav.expenseDesc;

                    let subCatName = subCat ? getSubCategoryName(subCat, language) : null;
                    if (!subCatName && tx.subCategoryId) {
                      const translatedSub = translateCategoryText(tx.subCategoryId, language);
                      if (translatedSub && translatedSub !== tx.subCategoryId) {
                        subCatName = translatedSub;
                      }
                    }

                    const exactTime = getExactTime(tx.date, tx.createdAt);
                    const translatedNote = tx.note ? translateCategoryText(tx.note, language) : '';
                    const itemName = translatedNote || (subCatName ? `${catName} › ${subCatName}` : catName);

                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Left: Category Icon & Item Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: cat?.color || '#f43f5e' }}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              {itemName}
                            </h4>

                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
                              <span className="font-medium text-zinc-600 dark:text-zinc-300">
                                {catName}
                              </span>

                              {subCatName && (
                                <>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                                    {subCatName}
                                  </span>
                                </>
                              )}

                              <span>•</span>
                              <span className="flex items-center gap-1 text-[10px] text-zinc-400 tabular-nums">
                                <Clock className="w-3 h-3 text-zinc-400" />
                                {exactTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Quick Delete */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                            <PrivacyCurrency
                              amount={Number(tx.amount)}
                              prefix="-"
                              className="font-bold text-rose-600 dark:text-rose-400"
                            />
                          </span>

                          <button
                            onClick={() => handleDelete(tx)}
                            className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-600 dark:text-zinc-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title={tCommon.delete}
                            aria-label={tCommon.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
    </div>
  );
};
