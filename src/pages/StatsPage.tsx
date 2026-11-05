import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import { PrivacyCurrency } from '../components/common/PrivacyCurrency';
import {
  getMonthlyStats,
  getCategorySpendingBreakdown,
} from '../utils/calculations';
import { formatMAD, formatDate, getCurrentMonthStr, isTransactionInMonth } from '../utils/formatters';
import { getCategoryIcon } from '../utils/icons';
import { getCategoryName, getSubCategoryName, translateCategoryText } from '../utils/i18nHelpers';
import { translations } from '../i18n/translations';
import { Transaction } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Percent,
  ShoppingBag,
  Award,
  TrendingDown,
  TrendingUp,
  PieChart as PieChartIcon,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';

export const StatsPage: React.FC = () => {
  const { transactions, categories, hideBalance, language } = useAppStore();
  const t = translations[language].stats;
  const isAr = language === 'ar';

  const currentMonth = getCurrentMonthStr();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const monthOptions = useMemo(() => {
    const months = new Set((transactions || []).map((tx) => tx.date.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)));
    months.add(currentMonth);
    const locale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US';
    return Array.from(months).sort((a, b) => b.localeCompare(a)).map((month) => ({
      value: month,
      label: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
      ),
    }));
  }, [transactions, currentMonth, language]);
  const monthlyStats = useMemo(() => {
    return getMonthlyStats(transactions, 6, language);
  }, [transactions, language]);

  // Transactions for the selected analytics month
  const currentMonthTx = useMemo(() => {
    return (transactions || []).filter((tx: Transaction) => isTransactionInMonth(tx.date, selectedMonth));
  }, [transactions, selectedMonth]);

  const currentIncome = useMemo(() => {
    return currentMonthTx
      .filter((tx: Transaction) => tx.type === 'income')
      .reduce((s: number, tx: Transaction) => s + (Number(tx.amount) || 0), 0);
  }, [currentMonthTx]);

  const currentExpense = useMemo(() => {
    return currentMonthTx
      .filter((tx: Transaction) => tx.type === 'expense')
      .reduce((s: number, tx: Transaction) => s + (Number(tx.amount) || 0), 0);
  }, [currentMonthTx]);

  const currentSavings = useMemo(() => {
    return currentMonthTx
      .filter((tx: Transaction) => tx.type === 'contribution')
      .reduce((s: number, tx: Transaction) => s + (Number(tx.amount) || 0), 0);
  }, [currentMonthTx]);

  // Savings rate calculation
  const savingsRate =
    currentIncome > 0
      ? Math.max(0, Math.min(100, Math.round((currentSavings / currentIncome) * 100)))
      : 0;

  // Keep the category breakdown tied to the selected month, including its empty state.
  const categoryBreakdownData = useMemo(() => {
    return getCategorySpendingBreakdown(categories, transactions, selectedMonth, language);
  }, [categories, transactions, selectedMonth, language]);

  const breakdownToDisplay = categoryBreakdownData.breakdown;
  const totalCategorySpent = categoryBreakdownData.totalExpense;
  const topCategory = breakdownToDisplay[0];

  // Top 3 most expensive transactions this month ("أكبر المصاريف" / Top Spends)
  const top3Spends = useMemo(() => {
    const monthExpenses = currentMonthTx.filter((tx: Transaction) => tx.type === 'expense');
    return [...monthExpenses]
      .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      .slice(0, 3);
  }, [currentMonthTx]);

  // Helper to extract time
  const getExactTime = (dateStr: string, createdAt?: string): string => {
    if (dateStr.includes('T')) return dateStr.split('T')[1].slice(0, 5);
    if (createdAt && createdAt.includes('T')) {
      const part = createdAt.split('T')[1];
      return part ? part.slice(0, 5) : '12:00';
    }
    return '12:00';
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-5 animate-page select-text pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
            <PieChartIcon className="w-4 h-4 stroke-[2.4]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t.title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t.subtitle}
        </p>
        </div>
        <label className="relative self-start sm:self-auto">
          <span className="sr-only">{language === 'ar' ? 'اختر الشهر' : language === 'fr' ? 'Choisir le mois' : 'Choose month'}</span>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="min-w-48 rounded-xl border border-black/[0.07] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
        </label>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Savings Rate Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">
              {t.savingsRate}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {savingsRate}%
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {currentSavings > 0 ? (
              <>
                <PrivacyCurrency
                  amount={currentSavings}
                  className="font-semibold text-zinc-900 dark:text-zinc-100"
                />{' '}
                {t.savedForGoals}
              </>
            ) : (
              t.noSavingsThisMonth
            )}
          </p>
        </div>

        {/* Top Spending Category */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">
              {t.topSpendingCategory}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          {topCategory ? (
            <>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white truncate">
                {(() => {
                  const cat = categories.find((c) => c.id === topCategory.id);
                  return cat ? getCategoryName(cat, language) : topCategory.name;
                })()}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <PrivacyCurrency
                  amount={topCategory.amount}
                  className="font-semibold text-rose-600 dark:text-rose-400"
                />
                <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                  {topCategory.percentage}%
                </span>
              </p>
            </>
          ) : (
            <div className="text-xs text-zinc-400 mt-2 font-medium">
              {t.noExpensesRecorded}
            </div>
          )}
        </div>

        {/* Financial Health Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">
              {t.summary}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
            {currentIncome >= currentExpense ? t.balancedBudget : t.deficitBudget}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {currentIncome >= currentExpense ? (
              <>
                {t.netSurplus}{' '}
                <PrivacyCurrency
                  amount={currentIncome - currentExpense}
                  className="font-bold text-emerald-600 dark:text-emerald-400"
                />
              </>
            ) : (
              <>
                {t.netDeficit}{' '}
                <PrivacyCurrency
                  amount={currentExpense - currentIncome}
                  className="font-bold text-rose-600 dark:text-rose-400"
                />
              </>
            )}
          </p>
        </div>
      </div>

      {/* Top Spends Widget ("أكبر المصاريف" / Top 3 Bleeds) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {t.topSpends}
              </h2>
              <p className="text-xs text-zinc-400">
                {t.topSpendsSubtitle}
              </p>
            </div>
          </div>
        </div>

        {top3Spends.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-400">
            {t.noTopSpends}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3Spends.map((tx, idx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const subCat = cat?.subcategories?.find((s) => s.id === tx.subCategoryId);
              const IconComp = cat ? getCategoryIcon(cat.icon) : ShoppingBag;
              let catName = cat ? getCategoryName(cat, language) : '';
              if (!catName) {
                const rawCat = (tx as any).categoryName || (tx as any).category || tx.categoryId;
                if (rawCat) {
                  catName = translateCategoryText(rawCat, language);
                }
              }
              if (!catName) {
                catName = translations[language].dashboard.addExpense;
              }

              let subCatName = subCat ? getSubCategoryName(subCat, language) : null;
              if (!subCatName && tx.subCategoryId) {
                const translatedSub = translateCategoryText(tx.subCategoryId, language);
                if (translatedSub && translatedSub !== tx.subCategoryId) {
                  subCatName = translatedSub;
                }
              }

              const exactTime = getExactTime(tx.date, tx.createdAt);
              const rankColor =
                idx === 0
                  ? 'bg-amber-500 text-white shadow-amber-500/20'
                  : idx === 1
                  ? 'bg-zinc-400 dark:bg-zinc-600 text-white shadow-zinc-500/20'
                  : 'bg-amber-700/80 text-white shadow-amber-700/20';

              const translatedNote = tx.note ? translateCategoryText(tx.note, language) : '';
              const title = translatedNote || (subCatName ? `${catName} › ${subCatName}` : catName);

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3 relative overflow-hidden group hover:border-black/[0.1] dark:hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 shadow-xs ${rankColor}`}
                    >
                      {idx + 1}
                    </div>

                    {/* Category Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat?.color || '#f43f5e' }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                        <span className="truncate">{catName}</span>
                        {subCatName && subCatName !== title && (
                          <>
                            <span>›</span>
                            <span className="truncate">{subCatName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="tabular-nums">{formatDate(tx.date, language)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                      <PrivacyCurrency
                        amount={Number(tx.amount)}
                        prefix="-"
                        className="font-extrabold text-rose-600 dark:text-rose-400"
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
      {/* Monthly income and expense trend */}
      <div className="p-5 sm:p-6 h-full rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              {t.incomeVsExpense}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t.incomeVsExpenseSubtitle}
            </p>
          </div>

          {/* Minimalist Legend Pills */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{t.incomeLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{t.expenseLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{t.savingsLabel}</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyStats}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#71717a"
                opacity={0.12}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 8 }}
                formatter={(value: number, name: string) => [
                  formatMAD(value, false, language),
                  name === 'income'
                    ? t.incomeLabel
                    : name === 'expense'
                    ? t.expenseLabel
                    : t.savingsLabel,
                ]}
                contentStyle={{
                  borderRadius: '16px',
                  backgroundColor: 'rgba(24, 24, 27, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                }}
              />
              <Bar
                dataKey="income"
                fill="#10b981"
                radius={[6, 6, 6, 6]}
                maxBarSize={28}
              />
              <Bar
                dataKey="expense"
                fill="#f43f5e"
                radius={[6, 6, 6, 6]}
                maxBarSize={28}
              />
              <Bar
                dataKey="savings"
                fill="#3b82f6"
                radius={[6, 6, 6, 6]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-5 sm:p-6 h-full rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            {t.categoryBreakdown}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t.categoryBreakdownSubtitle}
          </p>
        </div>

        {breakdownToDisplay.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            {t.noExpensesRecorded}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Animated Apple Donut Chart */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="w-56 h-56 sm:w-64 sm:h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: number) => [
                        formatMAD(val, false, language),
                        t.donutCenterTotal,
                      ]}
                      contentStyle={{
                        borderRadius: '14px',
                        backgroundColor: 'rgba(24, 24, 27, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Pie
                      data={breakdownToDisplay}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={3}
                      cornerRadius={6}
                      animationDuration={800}
                    >
                      {breakdownToDisplay.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.color}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Totals */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {t.donutCenterTotal}
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white tabular-nums mt-0.5">
                    <PrivacyCurrency
                      amount={totalCategorySpent}
                      className="font-extrabold text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Ranked Category List with Progress Bars */}
            <div className="lg:col-span-7 space-y-3.5">
              {breakdownToDisplay.map((item) => {
                const cat = categories.find((c) => c.id === item.id);
                const displayName = cat ? getCategoryName(cat, language) : item.name;
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {displayName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-[11px] font-semibold tabular-nums">
                          {item.percentage}%
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          <PrivacyCurrency
                            amount={item.amount}
                            className="font-bold text-zinc-900 dark:text-zinc-100"
                          />
                        </span>
                      </div>
                    </div>

                    {/* High contrast sleek progress bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: item.percentage === 0 ? '0%' : `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
