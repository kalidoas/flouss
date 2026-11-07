import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PrivacyCurrency } from '../components/common/PrivacyCurrency';
import {
  getMonthlyStats,
  getCategorySpendingBreakdown,
  getKpiData,
} from '../utils/calculations';
import { KpiCard } from '../components/common/KpiCard';
import { formatMAD, formatDate, getCurrentMonthStr, isTransactionInMonth } from '../utils/formatters';
import { getCategoryIcon } from '../utils/icons';
import {
  getCategoryName,
  getSubCategoryName,
  translateCategoryText,
  getIncomeSourceName,
  getIncomeTransactionTitle,
} from '../utils/i18nHelpers';
import { translations } from '../i18n/translations';
import { Transaction, TaskItem, TaskCategory } from '../types';
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
} from 'lucide-react';

const TASK_CATEGORY_META: Record<
  string,
  { label: { ar: string; fr: string; en: string }; icon: string; color: string; bg: string; border: string; barColor: string }
> = {
  deen: {
    label: { ar: 'دين وصلاة', fr: 'Deen & Spiritualité', en: 'Faith & Prayer' },
    icon: '🕌',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/20',
    barColor: '#10b981',
  },
  sport: {
    label: { ar: 'رياضة وصحة', fr: 'Sport & Santé', en: 'Sport & Fitness' },
    icon: '🏋️',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/20',
    barColor: '#f43f5e',
  },
  work: {
    label: { ar: 'عمل ودراسة', fr: 'Travail & Études', en: 'Work & Career' },
    icon: '💻',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    border: 'border-blue-500/20',
    barColor: '#3b82f6',
  },
  study: {
    label: { ar: 'تعلّم', fr: 'Apprentissage', en: 'Learning & Reading' },
    icon: '📚',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    border: 'border-indigo-500/20',
    barColor: '#6366f1',
  },
  running: {
    label: { ar: 'جري', fr: 'Course / Jri', en: 'Running' },
    icon: '🏃',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    border: 'border-orange-500/20',
    barColor: '#f97316',
  },
  discipline: {
    label: { ar: 'انضباط ووعي', fr: 'Discipline & Sobriété', en: 'Focus & Discipline' },
    icon: '🛡️',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    border: 'border-purple-500/20',
    barColor: '#a855f7',
  },
  routine: {
    label: { ar: 'روتين', fr: 'Routine', en: 'Routine' },
    icon: '⚡',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/20',
    barColor: '#f59e0b',
  },
  health: {
    label: { ar: 'صحة وماء', fr: 'Bien-être & Eau', en: 'Health & Hydration' },
    icon: '💧',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    border: 'border-cyan-500/20',
    barColor: '#06b6d4',
  },
  finance: {
    label: { ar: 'مالية', fr: 'Finances', en: 'Personal Finance' },
    icon: '💰',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    border: 'border-teal-500/20',
    barColor: '#14b8a6',
  },
  other: {
    label: { ar: 'أخرى', fr: 'Autre', en: 'Other' },
    icon: '📌',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-500/10 dark:bg-zinc-500/15',
    border: 'border-zinc-500/20',
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
    return getMonthlyStats(transactions, 6, language);
  }, [transactions, language]);

  // Filtered transactions for active month
  const currentMonthTx = useMemo(() => {
    return (transactions || []).filter((tx: Transaction) =>
      isTransactionInMonth(tx.date, selectedMonth)
    );
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

  const savingsRate =
    currentIncome > 0
      ? Math.max(0, Math.min(100, Math.round((currentSavings / currentIncome) * 100)))
      : 0;

  // Category spending breakdown for active month
  const categoryBreakdownData = useMemo(() => {
    return getCategorySpendingBreakdown(categories, transactions, selectedMonth, language);
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

  // Multi-domain discipline & lifestyle metrics dynamically computed from actual tasks
  const taskAnalytics = useMemo(() => {
    const validTasks = (tasks || []).filter((t) => !t.isArchived);
    const totalCount = validTasks.length;

    const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    // 1. Today's rate
    const todayISO = formatISODate(new Date());
    const todayCompletedCount = validTasks.filter(
      (t) => Array.isArray(t.completedDates) && t.completedDates.includes(todayISO)
    ).length;
    const todayRate = totalCount > 0 ? Math.round((todayCompletedCount / totalCount) * 100) : 0;

    // 2. Monthly Matrix rate & task performance list
    let totalCompletedCheckmarks = 0;
    const taskPerformanceList = validTasks.map((task) => {
      const datesInMonth = (task.completedDates || []).filter((d) => d.startsWith(selectedMonth));
      const monthlyCheckedCount = datesInMonth.length;
      totalCompletedCheckmarks += monthlyCheckedCount;
      const rate = daysInMonth > 0 ? Math.min(100, Math.round((monthlyCheckedCount / daysInMonth) * 100)) : 0;
      const streak = calculateStreak(task);

      return {
        ...task,
        monthlyCheckedCount,
        checkedCount: monthlyCheckedCount,
        isDoneToday: Array.isArray(task.completedDates) && task.completedDates.includes(todayISO),
        daysInMonth,
        rate,
        streak,
      };
    });

    const totalPossibleCheckmarks = totalCount * daysInMonth;
    const monthlyMatrixRate =
      totalPossibleCheckmarks > 0
        ? Math.round((totalCompletedCheckmarks / totalPossibleCheckmarks) * 100)
        : 0;

    const overallActiveStreak = taskPerformanceList.reduce((max, t) => Math.max(max, t.streak), 0);

    // 3. Category breakdown
    const categoryMap = new Map<
      string,
      { category: TaskCategory; tasksCount: number; completedCheckmarks: number; totalPossible: number }
    >();

    taskPerformanceList.forEach((task) => {
      const cat = task.category || 'other';
      const existing = categoryMap.get(cat) || {
        category: cat,
        tasksCount: 0,
        completedCheckmarks: 0,
        totalPossible: 0,
      };
      existing.tasksCount += 1;
      existing.completedCheckmarks += task.monthlyCheckedCount;
      existing.totalPossible += daysInMonth;
      categoryMap.set(cat, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((item) => {
        const rate =
          item.totalPossible > 0
            ? Math.min(100, Math.round((item.completedCheckmarks / item.totalPossible) * 100))
            : 0;
        return {
          ...item,
          rate,
        };
      })
      .sort((a, b) => b.completedCheckmarks - a.completedCheckmarks);

    return {
      totalCount,
      todayCompletedCount,
      todayRate,
      totalCompletedCheckmarks,
      totalPossibleCheckmarks,
      monthlyMatrixRate,
      overallActiveStreak,
      daysInMonth,
      categoryBreakdown,
      taskPerformanceList,
    };
  }, [tasks, selectedMonth]);

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
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-page select-text pb-12">
      {/* ── Page Header & Period Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold shadow-xs">
              <PieChartIcon className="w-5 h-5 stroke-[2.4]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {t.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            {t.subtitle}
          </p>
        </div>

        <label className="relative self-start sm:self-auto">
          <span className="sr-only">
            {language === 'ar' ? 'اختر الشهر' : language === 'fr' ? 'Choisir le mois' : 'Choose month'}
          </span>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="min-w-52 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/90 px-3.5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100 outline-none shadow-xs hover:border-black/[0.15] dark:hover:border-white/[0.15] focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ── SECTION A: TOP 6 EXECUTIVE KPI SUMMARY CARDS (3x2 RESPONSIVE GRID) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Total Inflow (Income) */}
        <KpiCard
          title={t.kpiIncome}
          value={kpiData.income.value}
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
          value={kpiData.expense.value}
          change={kpiData.expense.change}
          changeSuffix="%"
          changeLabel={t.kpiExpensesChange}
          icon={TrendingDown}
          color="rose"
          unit="MAD"
          extraLine={`${t.kpiDailyAvg}: ${formatMAD(kpiData.expense.avgDaily, false, language)}`}
          isPositiveGood={false}
        />

        {/* 3. Net Cash Flow */}
        <KpiCard
          title={t.kpiNetFlow}
          value={kpiData.netFlow.value}
          change={kpiData.netFlow.savingsRate}
          changeSuffix="%"
          changeLabel={t.kpiNetFlowDesc}
          icon={Activity}
          color={kpiData.netFlow.color}
          unit="MAD"
          extraLine={
            kpiData.netFlow.value >= 0
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

        {/* 4. Program & Tasks Completion */}
        <KpiCard
          title={t.kpiTasks}
          value={kpiData.tasks.todayRate}
          unit="%"
          icon={Percent}
          color="indigo"
          badge={`${kpiData.tasks.todayCompleted}/${kpiData.tasks.todayTotal}`}
          extraLine={`${kpiData.tasks.pendingCount} ${
            isAr ? 'مهام متبقية اليوم' : language === 'fr' ? 'tâches restantes' : 'pending tasks'
          }`}
          subtext={
            isAr
              ? `اليوم: ${kpiData.tasks.todayCompleted}/${kpiData.tasks.todayTotal} (${kpiData.tasks.todayRate}%) • الشهر: ${kpiData.tasks.monthlyRate}%`
              : `Today: ${kpiData.tasks.todayCompleted}/${kpiData.tasks.todayTotal} (${kpiData.tasks.todayRate}%) • Month: ${kpiData.tasks.monthlyRate}%`
          }
        />

        {/* 5. Net Debt Position */}
        <KpiCard
          title={t.kpiDebts}
          value={kpiData.debts.netPosition}
          icon={CreditCard}
          color={kpiData.debts.color}
          unit="MAD"
          badge={`${kpiData.debts.unsettledCount} ${
            t.unsettled || (isAr ? 'غير مسددة' : 'non réglés')
          }`}
          extraLine={`${isAr ? 'لك' : language === 'fr' ? 'Créances' : 'Owed'}: ${formatMAD(
            kpiData.debts.owedToMe,
            false,
            language
          )}`}
        />

        {/* 6. Recurring Burn (Subscriptions) */}
        <KpiCard
          title={t.kpiSubs}
          value={kpiData.subscriptions.total}
          icon={Repeat}
          color="blue"
          unit="MAD"
          change={kpiData.subscriptions.expensePercent}
          changeSuffix="%"
          changeLabel={t.kpiSubsBurn}
          count={kpiData.subscriptions.activeCount}
          countLabel={isAr ? 'اشتراكات نشطة' : language === 'fr' ? 'actifs' : 'active'}
          isPositiveGood={false}
        />
      </div>

      {/* ── SECTION B: SMART FINANCIAL & LIFESTYLE INSIGHTS (3-CARD GRID) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Savings Rate Card */}
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.savingsRate}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {savingsRate}%
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              {currentSavings > 0 ? (
                <>
                  <PrivacyCurrency
                    amount={currentSavings}
                    className="font-bold text-zinc-900 dark:text-zinc-100"
                  />{' '}
                  {t.savedForGoals}
                </>
              ) : (
                t.noSavingsThisMonth
              )}
            </p>
          </div>
        </div>

        {/* Top Spending Category Card */}
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.topSpendingCategory}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            {topCategory ? (
              <>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white truncate">
                  {(() => {
                    const cat = categories.find((c) => c.id === topCategory.id);
                    return cat ? getCategoryName(cat, language) : topCategory.name;
                  })()}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1.5">
                  <PrivacyCurrency
                    amount={topCategory.amount}
                    className="font-bold text-rose-600 dark:text-rose-400"
                  />
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                    {topCategory.percentage}% {isAr ? 'من المصاريف' : 'du total'}
                  </span>
                </p>
              </>
            ) : (
              <div className="text-xs text-zinc-400 mt-2 font-medium">
                {t.noExpensesRecorded}
              </div>
            )}
          </div>
        </div>

        {/* Financial Health Status Card */}
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.summary}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
              {currentIncome >= currentExpense ? t.balancedBudget : t.deficitBudget}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
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
      </div>

      {/* ── SECTION C: VISUAL CHARTS & BREAKDOWNS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* 1. Monthly income and expense trend */}
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
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                  {t.incomeLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                  {t.expenseLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
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
                  tickFormatter={(val) =>
                    val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                  }
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

        {/* 2. Category spending breakdown Donut & Progress list */}
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
              {/* Donut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
                <div className="w-60 h-60 sm:w-68 sm:h-68 relative flex items-center justify-center">
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

              {/* Ranked Category List with Progress Bars - Fully visible, no vertical clipping */}
              <div className="lg:col-span-7 space-y-3.5 pr-1">
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

      {/* ── SECTION D: TOP 5 EXPENSES & TOP INFLOWS (EXPANDED HORIZONTAL SPACE - NO TRUNCATION) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Expenses (Outflows) - Grouped by Parent Category */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shadow-xs">
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

          {top5ParentCategories.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              {t.noTopSpends}
            </div>
          ) : (
            <div className="space-y-2.5">
              {top5ParentCategories.map((item, idx) => {
                const cat = categories.find((c) => c.id === item.id);
                const IconComp = cat ? getCategoryIcon(cat.icon) : ShoppingBag;
                const catName = cat ? getCategoryName(cat, language) : item.name;

                const rankColor =
                  idx === 0
                    ? 'bg-rose-500 text-white shadow-rose-500/20'
                    : idx === 1
                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                    : idx === 2
                    ? 'bg-indigo-500 text-white shadow-indigo-500/20'
                    : 'bg-zinc-400 dark:bg-zinc-700 text-white shadow-zinc-500/20';

                return (
                  <div
                    key={item.id}
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
                        style={{ backgroundColor: item.color || cat?.color || '#f43f5e' }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white break-words">
                          {catName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5 flex-wrap">
                          <span className="font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums">
                            {item.percentage}% {isAr ? 'من المصاريف' : 'du total'}
                          </span>
                          <span>•</span>
                          <span className="tabular-nums">
                            {item.count} {isAr ? 'معاملات' : language === 'fr' ? 'opérations' : 'transactions'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                        <PrivacyCurrency
                          amount={Number(item.amount)}
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

        {/* Top 5 Inflows (Income) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                <ArrowUpRight className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  {t.topInflows || (isAr ? 'أكبر الواردات' : 'Top Inflows')}
                </h2>
                <p className="text-xs text-zinc-400">
                  {t.topInflowsSubtitle ||
                    (isAr ? 'أكبر المداخيل المسجلة هذا الشهر' : 'Top income transactions')}
                </p>
              </div>
            </div>
          </div>

          {top5Incomes.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              {t.noInflows || (isAr ? 'لا توجد واردات مسجلة' : 'No income recorded')}
            </div>
          ) : (
            <div className="space-y-2.5">
              {top5Incomes.map((tx, idx) => {
                const incomeTitle = getIncomeTransactionTitle(tx, incomeSources, language);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3 relative overflow-hidden group hover:border-black/[0.1] dark:hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 shadow-xs bg-emerald-600 text-white">
                        {idx + 1}
                      </div>

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-emerald-500">
                        <Wallet className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white break-words">
                          {incomeTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                          <span className="tabular-nums">{formatDate(tx.date, language)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        <PrivacyCurrency
                          amount={Number(tx.amount)}
                          prefix="+"
                          className="font-extrabold text-emerald-600 dark:text-emerald-400"
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

      {/* ── SECTION E: PERSONAL LIFE & PROGRAM DISCIPLINE MATRIX ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {isAr
                  ? 'البرنامج والانضباط الشخصي'
                  : language === 'fr'
                  ? 'Programme & Discipline Personnelle'
                  : 'Personal Life & Discipline Matrix'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? 'متابعة شاملة ودقيقة لجميع عادات ومهام البرنامج الشهري'
                  : language === 'fr'
                  ? 'Synthèse complète de toutes vos habitudes et tâches du mois'
                  : 'Comprehensive monthly tracking of all active habits and disciplines'}
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isAr ? 'إنجاز اليوم' : 'Today'}: {taskAnalytics.todayCompletedCount}/{taskAnalytics.totalCount} ({taskAnalytics.todayRate}%)
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isAr ? 'معدل الشهر' : 'Month'}: {taskAnalytics.monthlyMatrixRate}%
              </span>
            </div>
            {taskAnalytics.overallActiveStreak > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>
                  {taskAnalytics.overallActiveStreak} {isAr ? 'أيام متتالية' : 'days streak'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 1. Category Breakdown Badges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
              {isAr ? 'الأقسام ومجالات الانضباط' : language === 'fr' ? 'Domaines de discipline' : 'Discipline Domains'}
            </h3>
            <span className="text-zinc-400 text-[11px]">
              {taskAnalytics.categoryBreakdown.length} {isAr ? 'مجالات نشطة' : 'domaines actifs'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {taskAnalytics.categoryBreakdown.map((item) => {
              const meta = TASK_CATEGORY_META[item.category] || TASK_CATEGORY_META.other;
              const catLabel = meta.label[language] || meta.label.ar;
              return (
                <div
                  key={item.category}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {catLabel}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-white tabular-nums">
                      {item.rate}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>{item.tasksCount} {isAr ? 'مهام' : 'tâches'}</span>
                      <span className="tabular-nums">
                        {item.completedCheckmarks}/{item.totalPossible}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.rate}%`,
                          backgroundColor: meta.barColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Individual Task Performance List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
              {isAr ? 'أداء المهام اليومية - خلال الشهر' : language === 'fr' ? 'Performance individuelle des tâches' : 'Individual Task Performance'}
            </h3>
            <span className="text-zinc-400 text-[11px]">
              {taskAnalytics.taskPerformanceList.length} {isAr ? 'مهام مفعلة' : 'tâches actives'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {taskAnalytics.taskPerformanceList.map((task) => {
              const meta = TASK_CATEGORY_META[task.category] || TASK_CATEGORY_META.other;
              const catLabel = meta.label[language] || meta.label.ar;
              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] space-y-2.5 hover:border-black/[0.1] dark:hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-base shrink-0">{meta.icon}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {task.title}
                        </h4>
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 border ${meta.bg} ${meta.color} ${meta.border}`}>
                          {catLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-white tabular-nums">
                        {task.rate}%
                      </span>
                      {task.streak > 0 && (
                        <div className="flex items-center justify-end gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                          <Flame className="w-3 h-3 stroke-[2.5]" />
                          <span>{task.streak}d</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress info and bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{task.isDoneToday ? (isAr ? '✓ أنجزت اليوم' : '✓ Fait aujourd\'hui') : (isAr ? 'لم تنجز اليوم' : 'En attente')}</span>
                      <span className="tabular-nums">
                        {task.checkedCount} / {taskAnalytics.daysInMonth} {isAr ? 'يوم' : 'j'}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${task.rate}%`,
                          backgroundColor: meta.barColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
