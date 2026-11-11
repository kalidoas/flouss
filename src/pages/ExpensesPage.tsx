import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { MoneyText } from '../components/common/PrivacyCurrency';
import { AddExpenseModal } from '../components/transactions/AddExpenseModal';
import { translations } from '../i18n/translations';
import { formatMAD, formatDate, getCurrentMonthStr, formatMonthYear } from '../utils/formatters';
import { selectFinancialSummary } from '../utils/calculations';
import { getCategoryVisualColor } from '../utils/categoryColor';
import { getCategoryIcon } from '../utils/icons';
import { getCategoryName, getSubCategoryName, translateCategoryText } from '../utils/i18nHelpers';
import { Transaction } from '../types';
import { GlassMonthPicker } from '../components/common/GlassMonthPicker';
import { GlassCategoryPicker } from '../components/common/GlassCategoryPicker';
import { SwipeRow } from '../components/common/SwipeRow';
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

  // Metrics calculations with exact currency precision
  const totalExpenseAmount = useMemo(() => {
    return selectFinancialSummary(filteredExpenses).expenses;
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
    <div className="w-full max-w-[1280px] max-w-full overflow-x-hidden min-w-0 mx-auto space-y-5 animate-page select-text pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-rose-200 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddExpenseOpen(true)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white text-zinc-950 font-semibold px-5 py-2 text-sm shadow-sm hover:bg-zinc-200 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* KPI Highlight Cards with Crimson Glow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Expenses Card */}
        <div
          className="rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] flex items-center justify-between"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(244,63,94,0.15), transparent 70%)' }}
        >
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block mb-1.5">
              {t.totalExpenses}
            </span>
            <div className="text-3xl sm:text-4xl font-bold text-rose-400 tracking-tight tabular-nums">
              <MoneyText
                amount={totalExpenseAmount}
                prefix="-"
                className="font-bold text-rose-400"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5 font-medium">
              {viewScope === 'month' ? formatMonthYear(selectedMonth, language) : (language === 'ar' ? 'كل الأوقات' : 'Toutes les périodes')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        {/* Total Operations Count Card */}
        <div
          className="rounded-2xl bg-white/5 p-5 sm:p-6 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] flex items-center justify-between"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.12), transparent 70%)' }}
        >
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 block mb-1.5">
              {t.transactionsCount}
            </span>
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
              {filteredExpenses.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1.5 font-medium">
              {language === 'ar' ? 'عملية مسجلة' : 'opérations enregistrées'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 stroke-[2]" />
          </div>
        </div>
      </div>

      <p className="-mt-1 text-[11px] leading-relaxed text-zinc-500">
        {translations[language].summaryScopes.expenses}
      </p>

      {/* Filter and Search Bar */}
      <div className="relative z-50 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 sm:p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Scope Toggle: This Month vs All Time + Month Picker + Category Popover */}
          <div className="flex flex-wrap items-center gap-2 relative z-50">
            <div className="inline-flex rounded-full p-1 bg-white/[0.04] border border-white/[0.06] shrink-0">
              <button
                onClick={() => setViewScope('month')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewScope === 'month'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.filterThisMonth}
              </button>
              <button
                onClick={() => setViewScope('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewScope === 'all'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.filterAll}
              </button>
            </div>

            {viewScope === 'month' && (
              <GlassMonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions}
                ariaLabel={language === 'ar' ? 'اختر الشهر' : language === 'fr' ? 'Choisir le mois' : 'Choose month'}
              />
            )}

            {/* Custom Glass Category Popover (No horizontal scrolling pills) */}
            <GlassCategoryPicker
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onChange={setSelectedCategoryId}
              language={language}
              allLabel={t.allCategories}
            />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3.5 py-1.5 rounded-full text-xs bg-black/40 text-white border border-white/[0.08] focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Date-Grouped Expenses List */}
      {groupedByDate.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
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
            icon={<ShoppingBag className="w-8 h-8 text-rose-400" />}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateKey, items]) => {
            const dayTotal = selectFinancialSummary(items).expenses;
            const todayKey = new Date().toISOString().slice(0, 10);
            const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            let dateLabel = formatDate(dateKey, language);
            if (dateKey === todayKey) {
              dateLabel = language === 'ar' ? 'اليوم' : language === 'fr' ? "Aujourd'hui" : 'Today';
            } else if (dateKey === yesterdayKey) {
              dateLabel = language === 'ar' ? 'أمس' : language === 'fr' ? 'Hier' : 'Yesterday';
            }

            return (
              <div key={dateKey} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                      {dateLabel}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      ({items.length})
                    </span>
                  </div>

                  <span className="text-xs font-bold text-rose-400 tabular-nums">
                    - <MoneyText amount={dayTotal} />
                  </span>
                </div>

                {/* Day's Expenses Cards */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 divide-y divide-white/[0.05] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
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
                    const itemName = translatedNote || subCatName || catName;

                    return (
                      <SwipeRow
                        key={tx.id}
                        onDelete={() => handleDelete(tx)}
                        onEdit={() => setIsAddExpenseOpen(true)}
                      >
                        <div
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors group w-full min-w-0"
                        >
                          {/* Left: Category Icon & Item Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: getCategoryVisualColor(cat?.id) }}
                            >
                              <IconComp className="w-5 h-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
                                {itemName}
                              </h4>

                              <div className="mt-0.5">
                                <span className="inline-flex max-w-full rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400 truncate">
                                  {catName}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount & Quick Delete */}
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-shrink-0 whitespace-nowrap">
                            <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 tabular-nums">
                              <Clock className="w-3 h-3" />{exactTime}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-rose-400 tabular-nums shrink-0 flex-shrink-0 whitespace-nowrap">
                              <MoneyText
                                amount={Number(tx.amount)}
                                prefix="-"
                                className="font-bold text-rose-400 shrink-0 flex-shrink-0 whitespace-nowrap"
                              />
                            </span>

                            <button
                              onClick={() => handleDelete(tx)}
                              className="hidden sm:flex p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title={tCommon.delete}
                              aria-label={tCommon.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </SwipeRow>
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
