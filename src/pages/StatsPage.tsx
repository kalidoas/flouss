import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Money } from '../components/common/Money';
import {
  getMonthlyStats,
  getCategorySpendingBreakdown,
  getKpiData,
  selectFinancialSummary,
} from '../utils/calculations';
import { KpiCard } from '../components/common/KpiCard';
import { formatMAD, formatDate, getCurrentMonthStr, isTransactionInMonth } from '../utils/formatters';
import { getCategoryIcon } from '../utils/icons';
import { getCategoryVisualColor } from '../utils/categoryColor';
import {
  getCategoryName,
  getSubCategoryName,
  translateCategoryText,
  getIncomeSourceName,
  getIncomeTransactionTitle,
} from '../utils/i18nHelpers';
import { translations } from '../i18n/translations';
import { Transaction, TaskItem, TaskCategory } from '../types';
import { GlassMonthPicker } from '../components/common/GlassMonthPicker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Percent,
  ShoppingBag,
  Award,
  PieChart as PieChartIcon,
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  CreditCard,
  Repeat,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  Sparkles,
  Target,
  Zap,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { buildMonthlyCsv, buildMonthlyReportHtml } from '../utils/monthlyReport';

const TASK_CATEGORY_META: Record<
  string,
  { label: { ar: string; fr: string; en: string }; icon: string; color: string; bg: string; border: string; barColor: string }
> = {
  deen: {
    label: { ar: 'دين وصلاة', fr: 'Deen & Spiritualité', en: 'Faith & Prayer' },
    icon: '🕌',
    color: 'text-positive dark:text-positive',
    bg: 'bg-positive/10 dark:bg-positive/15',
    border: 'border-positive/20',
    barColor: 'bg-positive',
  },
  sport: {
    label: { ar: 'رياضة وصحة', fr: 'Sport & Santé', en: 'Sport & Fitness' },
    icon: '🏋️',
    color: 'text-negative dark:text-negative',
    bg: 'bg-negative/10 dark:bg-negative/15',
    border: 'border-negative/20',
    barColor: '#f43f5e',
  },
  work: {
    label: { ar: 'عمل ودراسة', fr: 'Travail & Études', en: 'Work & Career' },
    icon: '💻',
    color: 'text-info dark:text-info',
    bg: 'bg-info/10 dark:bg-info/15',
    border: 'border-info/20',
    barColor: 'bg-info',
  },
  study: {
    label: { ar: 'تعلّم', fr: 'Apprentissage', en: 'Learning & Reading' },
    icon: '📚',
    color: 'text-accent dark:text-accent',
    bg: 'bg-accent/10 dark:bg-accent/15',
    border: 'border-accent/20',
    barColor: 'bg-accent',
  },
  running: {
    label: { ar: 'جري', fr: 'Course / Jri', en: 'Running' },
    icon: '🏃',
    color: 'text-warning dark:text-warning',
    bg: 'bg-warning/10 dark:bg-warning/15',
    border: 'border-warning/20',
    barColor: '#f97316',
  },
  discipline: {
    label: { ar: 'انضباط ووعي', fr: 'Discipline & Sobriété', en: 'Focus & Discipline' },
    icon: '🛡️',
    color: 'text-accent dark:text-accent',
    bg: 'bg-accent/10 dark:bg-accent/15',
    border: 'border-accent/20',
    barColor: '#a855f7',
  },
  routine: {
    label: { ar: 'روتين', fr: 'Routine', en: 'Routine' },
    icon: '⚡',
    color: 'text-warning dark:text-warning',
    bg: 'bg-warning/10 dark:bg-warning/15',
    border: 'border-warning/20',
    barColor: '#f59e0b',
  },
  health: {
    label: { ar: 'صحة وماء', fr: 'Bien-être & Eau', en: 'Health & Hydration' },
    icon: '💧',
    color: 'text-info dark:text-info',
    bg: 'bg-info/10 dark:bg-info/15',
    border: 'border-info/20',
    barColor: '#06b6d4',
  },
  finance: {
    label: { ar: 'مالية', fr: 'Finances', en: 'Personal Finance' },
    icon: '💰',
    color: 'text-info dark:text-info',
    bg: 'bg-info/10 dark:bg-info/15',
    border: 'text-info/20',
    barColor: '#14b8a6',
  },
  other: {
    label: { ar: 'أخرى', fr: 'Autre', en: 'Other' },
    icon: '📌',
    color: 'text-muted dark:text-muted',
    bg: 'bg-surface-2/10 dark:bg-surface-30/15',
    border: 'border-border/20',
    barColor: '#71717a',
  },
};

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const calculateStreak = (task: TaskItem): number => {
  const completedSet = new Set(task.completedDates || []);
  let streak = 0;
  const checkDate = new Date();

  const todayISO = formatISODate(checkDate);
  if (!completedSet.has(todayISO)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const iso = formatISODate(checkDate);
    if (completedSet.has(iso)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export const StatsPage: React.FC = () => {
  const {
    transactions,
    categories,
    incomeSources,
    language,
    tasks,
    debts,
    subscriptions,
    gymLogs,
    salatLogs,
    studyModules,
    focusTasks,
  } = useAppStore();

  const t = translations[language].stats;
  const tCommon = translations[language].common;
  const isAr = language === 'ar';

  const currentMonth = getCurrentMonthStr();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Aggregated KPI data across all domains
  const kpiData = useMemo(() => {
    return getKpiData(
      transactions || [],
      tasks || [],
      debts || [],
      subscriptions || [],
      selectedMonth,
      language
    );
  }, [transactions, tasks, debts, subscriptions, selectedMonth, language]);

  // Available months list
  const monthOptions = useMemo(() => {
    const months = new Set(
      (transactions || [])
        .map((tx) => tx.date.slice(0, 7))
        .filter((month) => /^\d{4}-\d{2}$/.test(month))
    );
    months.add(currentMonth);
    const locale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US';
    return Array.from(months)
      .sort((a, b) => b.localeCompare(a))
      .map((month) => ({
        value: month,
        label: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
          new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
        ),
      }));
  }, [transactions, currentMonth, language]);

  // 6-Month rolling trend
  const monthlyStats = useMemo(() => {
    return getMonthlyStats(transactions || [], 6, language);
  }, [transactions, language]);

  // Filtered transactions for active month
  const currentMonthTx = useMemo(() => {
    return (transactions || []).filter((tx: Transaction) =>
      isTransactionInMonth(tx?.date, selectedMonth)
    );
  }, [transactions, selectedMonth]);
  const currentSummary = useMemo(
    () => selectFinancialSummary(transactions || [], { month: selectedMonth }),
    [transactions, selectedMonth]
  );
  const currentIncome = currentSummary.income;
  const currentExpense = currentSummary.expenses;
  const currentSavings = currentSummary.contributions;

  const savingsRate =
    currentIncome > 0
      ? Math.max(0, Math.min(100, Math.round((currentSavings / currentIncome) * 100)))
      : 0;

  // Category spending breakdown for active month
  const categoryBreakdownData = useMemo(() => {
    return getCategorySpendingBreakdown(categories || [], transactions || [], selectedMonth, language);
  }, [categories, transactions, selectedMonth, language]);

  const breakdownToDisplay = categoryBreakdownData.breakdown;
  const totalCategorySpent = categoryBreakdownData.totalExpense;
  const topCategory = breakdownToDisplay[0];

  // Top 5 parent categories by spending for active month (Aggregated across subcategories)
  const top5ParentCategories = useMemo(() => {
    return breakdownToDisplay.slice(0, 5);
  }, [breakdownToDisplay]);

  // Top 5 largest inflows (Income) with full horizontal width
  const top5Incomes = useMemo(() => {
    return [...currentMonthTx]
      .filter((tx: Transaction) => tx.type === 'income')
      .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      .slice(0, 5);
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

  const reportData = {
    month: selectedMonth,
    monthLabel: monthOptions.find((option) => option.value === selectedMonth)?.label || selectedMonth,
    income: currentSummary.income,
    expenses: currentSummary.expenses,
    net: currentSummary.net,
    transactions: currentMonthTx,
    language,
  };
  const exportCsv = () => {
    const blob = new Blob([buildMonthlyCsv(reportData)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flouss-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const savePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(buildMonthlyReportHtml(reportData));
    printWindow.document.close();
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-page select-text pb-12">
      {/* ── Page Header & Period Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-50">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={exportCsv} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-subtle bg-surface px-3 text-sm font-medium text-content hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            <FileSpreadsheet className="h-4 w-4" />{t.exportCsv}
          </button>
          <button type="button" onClick={savePdf} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-subtle bg-surface px-3 text-sm font-medium text-content hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            <Printer className="h-4 w-4" />{t.savePdf}
          </button>
          <GlassMonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={monthOptions}
            ariaLabel={tCommon.chooseMonth}
          />
        </div>
      </div>

      {/* ── SECTION A: TOP 6 EXECUTIVE KPI SUMMARY CARDS (3x2 RESPONSIVE GRID) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* 1. Total Inflow (Income) */}
        <KpiCard
          title={t.kpiIncome}
          value={currentSummary.income}
          change={kpiData.income.change}
          changeSuffix="%"
          changeLabel={t.kpiIncomeChange}
          icon={TrendingUp}
          color="emerald"
          unit="MAD"
          count={kpiData.income.count}
          countLabel={t.kpiIncomeCount}
          isPositiveGood={true}
        />

        {/* 2. Total Outflow (Expenses) */}
        <KpiCard
          title={t.kpiExpenses}
          value={currentSummary.expenses}
          change={kpiData.expense.change}
          changeSuffix="%"
          changeLabel={t.kpiExpensesChange}
          icon={TrendingDown}
          color="rose"
          unit="MAD"
          extraLine={<>{t.kpiDailyAvg}: <Money amount={kpiData.expense.avgDaily} /></>}
          isPositiveGood={false}
        />

        {/* 3. Net Cash Flow */}
        <KpiCard
          title={t.kpiNetFlow}
          value={currentSummary.net}
          change={kpiData.netFlow.savingsRate}
          changeSuffix="%"
          changeLabel={t.kpiNetFlowDesc}
          icon={Activity}
          color={kpiData.netFlow.color}
          unit="MAD"
          extraLine={
          currentSummary.net >= 0
              ? isAr
                ? 'فائض مالي مريح'
                : language === 'fr'
                ? 'Surplus sain'
                : 'Healthy surplus'
              : isAr
              ? 'عجز مالي شهري'
              : language === 'fr'
              ? 'Déficit mensuel'
              : 'Monthly deficit'
          }
          isPositiveGood={true}
        />

        {/* 4. Savings Rate */}
        <div
          className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-surface/5 backdrop-blur-xl border border-border/10 overflow-hidden min-h-[142px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] transition-all relative"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.12), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.14em] uppercase text-muted">
            <span>{t.savingsRate}</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-accent/20 bg-accent/10 text-accent">
              <Percent className="h-3.5 w-3.5 stroke-[2.4]" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-accent-contrast tabular-nums">
              {savingsRate}%
            </div>
          </div>
          <div className="pt-2.5 mt-auto border-t border-border/[0.06] text-[11px] text-muted truncate">
            {currentSavings > 0 ? (
              <span className="flex items-center gap-1">
                <Money amount={currentSavings} /> {t.savedForGoals}
              </span>
            ) : (
              <span>{t.noSavingsThisMonth}</span>
            )}
          </div>
        </div>
      </div>

      <p className="-mt-3 text-[11px] leading-relaxed text-muted">
        {translations[language].summaryScopes.analytics}
      </p>

      {/* ── SECTION B: SMART FINANCIAL & LIFESTYLE INSIGHTS (BALANCED BENTO PAIR) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Spending Category Card */}
        <div
          className="p-5 sm:p-6 rounded-2xl bg-surface/5 backdrop-blur-xl border border-border/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[170px] relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(244,63,94,0.12), transparent 70%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              {t.topSpendingCategory}
            </span>
            <div className="w-8 h-8 rounded-xl bg-negative/10 border border-negative/20 text-negative flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div className="my-2">
            {topCategory ? (
              <div>
                <div className="text-xl sm:text-2xl font-bold text-accent-contrast tracking-tight truncate">
                  {(() => {
                    const cat = categories.find((c) => c.id === topCategory.id);
                    return cat ? getCategoryName(cat, language) : topCategory.name;
                  })()}
                </div>
                <div className="text-xs text-muted mt-2 flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-negative text-sm tabular-nums">
                    <Money amount={topCategory.amount} />
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-negative/15 border border-negative/20 text-[11px] font-bold text-negative tabular-nums">
                    {topCategory.percentage}% {t.ofSpending}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted font-medium">
                {t.noExpensesRecorded}
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-border-subtle dark:border-border/[0.06] text-[11px] text-muted dark:text-muted">
            {t.topCategoryImpact}
          </div>
        </div>

        {/* Financial Health Status Card */}
        <div
          className="p-5 sm:p-6 rounded-2xl bg-surface dark:bg-surface/5 backdrop-blur-xl border border-border-subtle dark:border-border/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[170px] relative overflow-hidden"
          style={{ backgroundImage: currentIncome >= currentExpense ? 'radial-gradient(circle at 100% 0%, rgba(52,211,153,0.12), transparent 70%)' : 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.12), transparent 70%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted dark:text-muted">
              {t.summary}
            </span>
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${currentIncome >= currentExpense ? 'bg-positive/10 border-positive/20 text-positive' : 'bg-warning/10 border-warning/20 text-warning'}`}>
              <Award className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentIncome >= currentExpense ? 'bg-positive/15 border-positive/25 text-positive dark:text-positive' : 'bg-warning/15 border-warning/25 text-warning dark:text-warning'}`}>
                {currentIncome >= currentExpense ? t.healthyFinances : t.attentionRequired}
              </span>
            </div>
            <p className="text-sm font-semibold text-content dark:text-text leading-snug">
              {currentIncome >= currentExpense
                ? (isAr ? 'واصل ادخار جزء من فائضك هذا الشهر.' : language === 'fr' ? 'Continuez à épargner une part de votre solde positif.' : 'Keep saving part of this month’s surplus.')
                : (isAr ? 'راجع مصروفاتك لتقليل العجز هذا الشهر.' : language === 'fr' ? 'Réduisez une dépense pour limiter le déficit du mois.' : 'Trim one expense to reduce this month’s shortfall.')}
            </p>
          </div>

          <div className="pt-2.5 border-t border-border-subtle dark:border-border/[0.06] flex items-center justify-between text-[11px] text-muted dark:text-muted">
            <span>{t.flowBalance}</span>
            <span className="font-semibold text-content dark:text-muted tabular-nums">
              {currentIncome > 0 ? `${Math.min(100, Math.round((currentExpense / currentIncome) * 100))}% ${t.consumedPercent}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION C: VISUAL CHARTS & BREAKDOWNS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        {/* 1. Monthly income and expense trend */}
        <div className="p-5 sm:p-6 h-full rounded-2xl bg-surface border border-border-subtle shadow-xs dark:bg-surface/5 dark:backdrop-blur-xl dark:border-border/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-text dark:text-text tracking-tight">
                {t.incomeVsExpense}
              </h2>
              <p className="text-xs text-muted dark:text-muted mt-0.5">
                {t.incomeVsExpenseSubtitle}
              </p>
            </div>

            {/* Minimalist Legend Pills */}
            <div className="flex items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas/[0.04] dark:bg-surface/[0.04] border border-border/[0.06] dark:border-border/[0.06]">
                <span className="w-2 h-2 rounded-full bg-positive dark:bg-positive" />
                <span className="text-text dark:text-muted font-medium text-[11px]">
                  {t.incomeLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas/[0.04] dark:bg-surface/[0.04] border border-border/[0.06] dark:border-border/[0.06]">
                <span className="w-2 h-2 rounded-full bg-negative dark:bg-negative" />
                <span className="text-text dark:text-muted font-medium text-[11px]">
                  {t.expenseLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas/[0.04] dark:bg-surface/[0.04] border border-border/[0.06] dark:border-border/[0.06]">
                <span className="w-2 h-2 rounded-full bg-info dark:bg-info" />
                <span className="text-text dark:text-muted font-medium text-[11px]">
                  {t.savingsLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full pt-4 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyStats}
                margin={{ top: 16, right: 12, left: 4, bottom: 4 }}
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="text-content"
                  opacity={0.06}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                  }
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 8 }}
                  formatter={(value: number, name: string) => [
                    <Money key="amount" amount={value} />,
                    name === 'income'
                      ? t.incomeLabel
                      : name === 'expense'
                      ? t.expenseLabel
                      : t.savingsLabel,
                  ]}
                  contentStyle={{
                    borderRadius: '16px',
                    backgroundColor: 'rgba(13, 14, 20, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(16px)',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 16px 36px -10px rgba(0,0,0,0.6)',
                  }}
                />
                <Bar
                  dataKey="income"
                  fill="bg-positive"
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
                  fill="bg-info"
                  radius={[6, 6, 6, 6]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Category spending breakdown Donut & Progress list */}
        <div className="p-5 sm:p-6 h-full rounded-2xl bg-surface border border-border-subtle shadow-xs dark:bg-surface/5 dark:backdrop-blur-xl dark:border-border/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] space-y-4">
          <div>
            <h2 className="text-base font-bold text-text dark:text-text tracking-tight">
              {t.categoryBreakdown}
            </h2>
            <p className="text-xs text-muted dark:text-muted mt-0.5">
              {t.categoryBreakdownSubtitle}
            </p>
          </div>

          {breakdownToDisplay.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              {t.noExpensesRecorded}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Donut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
                <div className="w-56 h-56 sm:w-64 sm:h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(val: number) => [
                          <Money key="amount" amount={val} />,
                          t.donutCenterTotal,
                        ]}
                        contentStyle={{
                          borderRadius: '14px',
                          backgroundColor: 'rgba(13, 14, 20, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(16px)',
                          color: '#fff',
                          fontSize: '11px',
                          boxShadow: '0 16px 36px -10px rgba(0,0,0,0.6)',
                        }}
                      />
                      <Pie
                        data={breakdownToDisplay}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={92}
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
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-muted">
                      {t.donutCenterTotal}
                    </span>
                    <div className="text-base sm:text-lg font-bold text-text dark:text-text tabular-nums mt-0.5">
                      <Money
                        amount={totalCategorySpent}
                        className="font-bold text-text dark:text-text"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ranked Category List with Progress Bars */}
              <div className="lg:col-span-7 space-y-3 pr-1">
                {breakdownToDisplay.map((item) => {
                  const cat = categories.find((c) => c.id === item.id);
                  const displayName = cat ? getCategoryName(cat, language) : item.name;
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-text dark:text-text">
                            {displayName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted text-[11px] font-medium tabular-nums">
                            {item.percentage}%
                          </span>
                          <span className="font-bold text-text dark:text-text tabular-nums">
                            <Money
                              amount={item.amount}
                              className="font-bold text-text dark:text-text"
                            />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-canvas/[0.06] dark:bg-surface/[0.06] rounded-full h-1.5 overflow-hidden">
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

      {/* ── SECTION D: TOP 5 EXPENSES & TOP INFLOWS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 5 Expenses (Outflows) - Grouped by Parent Category */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border-subtle shadow-xs dark:bg-surface/5 dark:backdrop-blur-xl dark:border-border/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-negative/10 text-negative dark:text-negative border border-negative/20 flex items-center justify-center">
                <Flame className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text dark:text-text tracking-tight">
                  {t.topSpends}
                </h2>
                <p className="text-xs text-muted dark:text-muted">
                  {t.topSpendsSubtitle}
                </p>
              </div>
            </div>
          </div>

          {top5ParentCategories.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              {t.noTopSpends}
            </div>
          ) : (
            <div className="space-y-2">
              {top5ParentCategories.map((item, idx) => {
                const cat = categories.find((c) => c.id === item.id);
                const IconComp = cat ? getCategoryIcon(cat.icon) : ShoppingBag;
                const catName = cat ? getCategoryName(cat, language) : item.name;

                const rankBg =
                  idx === 0
                    ? 'bg-negative/20 text-negative dark:text-negative border border-negative/30'
                    : idx === 1
                    ? 'bg-warning/20 text-warning dark:text-warning border border-warning/30'
                    : idx === 2
                    ? 'bg-accent/20 text-accent dark:text-accent border border-accent/30'
                    : 'bg-canvas/[0.04] text-muted border border-border/[0.06] dark:bg-surface/[0.06] dark:text-muted dark:border-border/[0.08]';

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-canvas/[0.02] border border-border/[0.06] dark:bg-surface/[0.02] dark:border-border/[0.06] flex items-center justify-between gap-3 relative overflow-hidden group hover:border-border/[0.12] dark:hover:border-border/[0.12] hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${rankBg}`}
                      >
                        {idx + 1}
                      </div>

                      {/* Category Icon */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-accent-contrast shrink-0 shadow-xs"
                        style={{ backgroundColor: getCategoryVisualColor(cat?.id || item.id) }}
                      >
                        <IconComp className="w-4 h-4 stroke-[2]" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-text dark:text-text truncate group-hover:text-text dark:group-hover:text-accent-contrast transition-colors">
                          {catName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted dark:text-muted mt-0.5 flex-wrap">
                          <span className="font-semibold text-negative dark:text-negative tabular-nums">
                            {item.percentage}% {t.ofSpending}
                          </span>
                          <span>•</span>
                          <span className="tabular-nums">
                            {item.count} {tCommon.transactionsShort}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-sm font-bold text-negative dark:text-negative tabular-nums">
                        <Money
                          amount={Number(item.amount)}
                          prefix="− "
                          className="font-bold text-negative dark:text-negative"
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 5 Inflows (Income) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border-subtle shadow-xs dark:bg-surface/5 dark:backdrop-blur-xl dark:border-border/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-positive/10 text-positive dark:text-positive border border-positive/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text dark:text-text tracking-tight">
                  {t.topInflows}
                </h2>
                <p className="text-xs text-muted dark:text-muted">
                  {t.topInflowsSubtitle}
                </p>
              </div>
            </div>
          </div>

          {top5Incomes.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              {t.noInflows || 'No income recorded'}
            </div>
          ) : (
            <div className="space-y-2">
              {top5Incomes.map((tx, idx) => {
                const incomeTitle = getIncomeTransactionTitle(tx, incomeSources, language);

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-canvas/[0.02] border border-border/[0.06] dark:bg-surface/[0.02] dark:border-border/[0.06] flex items-center justify-between gap-3 relative overflow-hidden group hover:border-border/[0.12] dark:hover:border-border/[0.12] hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-positive/20 text-positive dark:text-positive border border-positive/30">
                        {idx + 1}
                      </div>

                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-positive dark:text-positive bg-positive/15 border border-positive/25 shrink-0">
                        <Wallet className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-text dark:text-text truncate group-hover:text-text dark:group-hover:text-accent-contrast transition-colors">
                          {incomeTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted dark:text-muted mt-0.5">
                          <span className="tabular-nums">{formatDate(tx.date, language)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-sm font-bold text-positive dark:text-positive tabular-nums">
                        <Money
                          amount={Number(tx.amount)}
                          prefix="+ "
                          className="font-bold text-positive dark:text-positive"
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
