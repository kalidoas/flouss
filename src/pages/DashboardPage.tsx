import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { GoalProgressBar } from '../components/goals/GoalProgressBar';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { AddExpenseModal } from '../components/transactions/AddExpenseModal';
import { AddIncomeModal } from '../components/transactions/AddIncomeModal';
import { AddContributionModal } from '../components/transactions/AddContributionModal';
import { CountUpNumber } from '../components/common/CountUpNumber';
import { FocusTaskList } from '../components/dashboard/FocusTaskList';
import {
  calculateAvailableBalance,
  calculateNetWorth,
  calculateGoalProgress,
  getCategorySpendingBreakdown,
  calculateTotalSavingsInGoals,
} from '../utils/calculations';
import { formatMAD, getCurrentMonthStr, formatMonthYear } from '../utils/formatters';
import { Category, RecurringIncomeRule, Transaction } from '../types';
import { translations } from '../i18n/translations';
import { getIncomeSourceName, getCategoryName } from '../utils/i18nHelpers';
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ChevronRight,
  Wallet,
  Sparkles,
  CheckCircle2,
  BellRing,
  PiggyBank,
  PieChart as PieIcon,
  Receipt,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const DashboardPage: React.FC = () => {
  const {
    initialBalance,
    transactions,
    categories,
    incomeSources,
    recurringRules,
    dismissedRecurringForMonth,
    confirmRecurringIncome,
    dismissRecurringPrompt,
    contributeToAllGoals,
    hideBalance,
    setActiveScreen,
    language,
  } = useAppStore();

  const tDash = translations[language].dashboard;
  const isAr = language === 'ar';

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [isSaveAllModalOpen, setIsSaveAllModalOpen] = useState(false);

  const currentMonth = getCurrentMonthStr();
  const today = new Date();
  const currentDayOfMonth = today.getDate();

  // Metrics
  const balance = calculateAvailableBalance(initialBalance, transactions);
  const netWorth = calculateNetWorth(initialBalance, transactions, categories);
  const totalInGoals = calculateTotalSavingsInGoals(categories, transactions);

  // Month-to-date metrics
  const currentMonthTx = transactions.filter((t: Transaction) => t.date.startsWith(currentMonth));
  const incomeThisMonth = currentMonthTx
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  const expenseThisMonth = currentMonthTx
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  const savedThisMonth = currentMonthTx
    .filter((t: Transaction) => t.type === 'contribution')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  // Donut Spending Breakdown
  const { breakdown: spendingBreakdown, totalExpense: monthlyTotalExpense } =
    getCategorySpendingBreakdown(categories, transactions, currentMonth, language);

  // Active savings goals
  const activeGoalCategories = categories
    .filter((c: Category) => c.isGoal && !c.isArchived && (c.targetAmount || 0) > 0)
    .sort((a: Category, b: Category) => {
      const calcA = calculateGoalProgress(a, transactions);
      const calcB = calculateGoalProgress(b, transactions);
      if (calcA.status === 'completed' && calcB.status !== 'completed') return 1;
      if (calcB.status === 'completed' && calcA.status !== 'completed') return -1;
      return calcB.progressPercent - calcA.progressPercent;
    });

  const top3Goals = activeGoalCategories.slice(0, 3);

  // Monthly Savings Reminder Calculations
  const totalMonthlyGoalTarget = activeGoalCategories.reduce((sum, g) => {
    const calc = calculateGoalProgress(g, transactions);
    return calc.status !== 'completed' ? sum + calc.monthlyNeeded : sum;
  }, 0);

  const savedThisMonthToGoals = currentMonthTx
    .filter((t: Transaction) => t.type === 'contribution')
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingToSaveThisMonth = Math.max(0, totalMonthlyGoalTarget - savedThisMonthToGoals);

  // Check recurring income prompt
  const dueRecurringRule = recurringRules.find((rule: RecurringIncomeRule) => {
    const isDue = currentDayOfMonth >= rule.dayOfMonth;
    const notConfirmedThisMonth = rule.lastConfirmedMonth !== currentMonth;
    const notDismissedThisMonth =
      !(dismissedRecurringForMonth ?? []).includes(rule.id + '_' + currentMonth) &&
      !(dismissedRecurringForMonth ?? []).includes(currentMonth);
    return isDue && notConfirmedThisMonth && notDismissedThisMonth;
  });

  const dueSource = dueRecurringRule
    ? incomeSources.find((s) => s.id === dueRecurringRule.sourceId)
    : null;

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  const handleOpenGoalContribution = (goalCatId?: string) => {
    setSelectedGoalId(goalCatId);
    setIsContributionOpen(true);
  };

  const handleExecuteSaveAll = () => {
    contributeToAllGoals();
    setIsSaveAllModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-page select-text">
      {/* Recurring Income Due Banner */}
      {dueRecurringRule && dueSource && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-[#37352f] dark:text-[#ecebed]">
                {tDash.recurringBannerTitle}
              </h4>
              <p className="text-[#787774] dark:text-[#9b9a97] mt-0.5">
                {tDash.recurringBannerDesc
                  .replace('{source}', getIncomeSourceName(dueSource, language))
                  .replace('{amount}', formatMAD(dueRecurringRule.amount, false, language))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => dismissRecurringPrompt(currentMonth)}
              className="px-2.5 py-1 text-xs text-[#787774] hover:text-[#37352f] transition-colors"
            >
              {tDash.dismiss}
            </button>
            <button
              onClick={() => {
                const tx: Transaction = {
                  id: 'tx_' + Date.now(),
                  type: 'income',
                  amount: dueRecurringRule.amount,
                  sourceId: dueRecurringRule.sourceId,
                  date: new Date().toISOString(),
                  note: 'Revenu récurrent confirmé',
                  isRecurring: true,
                  createdAt: new Date().toISOString(),
                };
                confirmRecurringIncome(dueRecurringRule.id, currentMonth, tx);
              }}
              className="px-3 py-1 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{tDash.confirmRecurring}</span>
            </button>
          </div>
        </div>
      )}

      {/* Notion-style Clean Financial Overview Card */}
      <div className="bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] rounded-lg p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1 text-xs text-[#787774] dark:text-[#9b9a97]">
          <span className="flex items-center gap-1.5 font-medium text-[#37352f] dark:text-[#ecebed]">
            <Wallet className="w-4 h-4 text-[#787774]" />
            <span>{tDash.totalBalance}</span>
          </span>
          <span className="bg-[#f1f0ee] dark:bg-[#282828] text-[#787774] dark:text-[#9b9a97] px-2 py-0.5 rounded text-[11px] font-mono">
            {formatMonthYear(currentMonth, language)}
          </span>
        </div>

        {/* Big Balance Number with Count-Up Animation & Tabular Nums */}
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#37352f] dark:text-[#ecebed] mb-4">
          <CountUpNumber
            value={balance}
            hide={hideBalance}
            language={language}
            duration={600}
          />
        </div>

        {/* Clean Sub Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#e3e2de] dark:border-[#2f2f2f] text-xs">
          <div>
            <span className="text-[#787774] dark:text-[#9b9a97] block text-[11px]">
              {tDash.netWorth}
            </span>
            <span
              className={`font-semibold text-sm tabular-nums text-[#37352f] dark:text-[#ecebed] transition-[filter] duration-200 ${
                hideBalance ? 'privacy-blur' : ''
              }`}
            >
              {formatMAD(netWorth, false, language)}
            </span>
          </div>

          <div>
            <span className="text-[#787774] dark:text-[#9b9a97] block text-[11px]">
              {tDash.inSavings}
            </span>
            <span
              className={`font-semibold text-sm tabular-nums text-[#37352f] dark:text-[#ecebed] transition-[filter] duration-200 ${
                hideBalance ? 'privacy-blur' : ''
              }`}
            >
              {formatMAD(totalInGoals, false, language)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[#787774] dark:text-[#9b9a97] block text-[11px]">
              {tDash.savedThisMonth}
            </span>
            <span
              className={`font-semibold text-sm tabular-nums text-emerald-600 dark:text-emerald-400 transition-[filter] duration-200 ${
                hideBalance ? 'privacy-blur' : ''
              }`}
            >
              +{formatMAD(savedThisMonth, false, language)}
            </span>
          </div>
        </div>
      </div>

      {/* Notion Focus View: "Ma liste" Section */}
      <FocusTaskList />

      {/* Quick Action Buttons (Notion style) */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setIsIncomeOpen(true)}
          className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] hover:bg-[#fbfbfa] dark:hover:bg-[#252525] transition-colors"
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-[#37352f] dark:text-[#ecebed]">
            + {tDash.addIncome}
          </span>
        </button>

        <button
          onClick={() => setIsExpenseOpen(true)}
          className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] hover:bg-[#fbfbfa] dark:hover:bg-[#252525] transition-colors"
        >
          <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="text-xs font-medium text-[#37352f] dark:text-[#ecebed]">
            + {tDash.addExpense}
          </span>
        </button>

        <button
          onClick={() => handleOpenGoalContribution()}
          className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] hover:bg-[#fbfbfa] dark:hover:bg-[#252525] transition-colors"
        >
          <Target className="w-4 h-4 text-[#2383e2]" />
          <span className="text-xs font-medium text-[#37352f] dark:text-[#ecebed]">
            {tDash.addContribution}
          </span>
        </button>
      </div>

      {/* Monthly Savings Reminder Card */}
      {totalMonthlyGoalTarget > 0 && (
        <div className="p-4 rounded-lg bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#f1f0ee] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed] flex items-center justify-center shrink-0">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-[#37352f] dark:text-[#ecebed]">
                  {tDash.savingsReminderTitle} :{' '}
                  <span
                    className={`font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 transition-[filter] duration-200 ${
                      hideBalance ? 'privacy-blur' : ''
                    }`}
                  >
                    {formatMAD(totalMonthlyGoalTarget, false, language)}
                  </span>
                </h4>
              </div>
              <p className="text-[#787774] dark:text-[#9b9a97] mt-0.5">
                <span className={hideBalance ? 'privacy-blur' : ''}>
                  {formatMAD(savedThisMonthToGoals, false, language)}
                </span>{' '}
                {tDash.alreadySavedOf} {formatMAD(totalMonthlyGoalTarget, false, language)}{' '}
                {tDash.monthlyTarget}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {remainingToSaveThisMonth > 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSaveAllModalOpen(true)}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                <span>{tDash.saveAllButton}</span>
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Objectif mensuel complété !
              </span>
            )}
          </div>
        </div>
      )}

      {/* Month Flow Overview: Income vs Expense Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span>{tDash.incomeThisMonth}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div
            className={`text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums transition-[filter] duration-200 ${
              hideBalance ? 'privacy-blur' : ''
            }`}
          >
            +{formatMAD(incomeThisMonth, false, language)}
          </div>
          <span className="text-[11px] text-[#9b9a97] mt-0.5 block">
            {currentMonthTx.filter((t: Transaction) => t.type === 'income').length} versement(s)
          </span>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            <span>{tDash.expensesThisMonth}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          </div>
          <div
            className={`text-lg sm:text-xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums transition-[filter] duration-200 ${
              hideBalance ? 'privacy-blur' : ''
            }`}
          >
            -{formatMAD(expenseThisMonth, false, language)}
          </div>
          <span className="text-[11px] text-[#9b9a97] mt-0.5 block">
            {currentMonthTx.filter((t: Transaction) => t.type === 'expense').length} dépense(s)
          </span>
        </Card>
      </div>

      {/* Two Column Grid: Spending Donut + Top Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Spending Breakdown Donut (5 cols) */}
        <div className="lg:col-span-5">
          <Card padding="md" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-xs sm:text-sm text-[#37352f] dark:text-[#ecebed]">
                  {tDash.spendingBreakdown}
                </h3>
                <span className="text-[11px] text-[#787774] dark:text-[#9b9a97]">Ce mois-ci</span>
              </div>

              {spendingBreakdown.length === 0 ? (
                <EmptyState
                  icon={<PieIcon className="w-5 h-5" />}
                  title={tDash.noExpensesThisMonth}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsExpenseOpen(true)}
                      icon={<ArrowDownRight className="w-3.5 h-3.5" />}
                    >
                      {tDash.addExpenseCta}
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="h-40 sm:h-44 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingBreakdown}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={68}
                          paddingAngle={2}
                        >
                          {spendingBreakdown.map((entry) => (
                            <Cell key={`cell-${entry.id}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [formatMAD(value, false, language), 'Dépense']}
                          contentStyle={{
                            borderRadius: '6px',
                            backgroundColor: '#202020',
                            border: '1px solid #2f2f2f',
                            color: '#ecebed',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase">
                        Total
                      </span>
                      <span
                        className={`text-xs font-semibold text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${
                          hideBalance ? 'privacy-blur' : ''
                        }`}
                      >
                        {formatMAD(monthlyTotalExpense, false, language)}
                      </span>
                    </div>
                  </div>

                  {/* Top Spending Items list */}
                  <div className="space-y-1 mt-2">
                    {spendingBreakdown.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[#37352f] dark:text-[#ecebed] truncate max-w-[140px]">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#787774] text-[11px] tabular-nums">
                            {item.percentage}%
                          </span>
                          <span
                            className={`font-medium text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${
                              hideBalance ? 'privacy-blur' : ''
                            }`}
                          >
                            {formatMAD(item.amount, false, language)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Top Goals (7 cols) */}
        <div className="lg:col-span-7">
          <Card padding="md" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs sm:text-sm text-[#37352f] dark:text-[#ecebed]">
                    {tDash.topGoals}
                  </h3>
                  {top3Goals.length > 0 && (
                    <span className="text-[11px] bg-[#f1f0ee] dark:bg-[#282828] text-[#787774] dark:text-[#9b9a97] px-1.5 py-0.2 rounded font-mono">
                      {top3Goals.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveScreen('categories')}
                  className="text-xs text-[#2383e2] hover:underline flex items-center gap-0.5"
                >
                  <span>{tDash.seeAllGoals}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {top3Goals.length === 0 ? (
                <EmptyState
                  icon={<Target className="w-5 h-5" />}
                  title={tDash.noGoalsYet}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveScreen('categories')}
                    >
                      + {tDash.createFirstGoal}
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {top3Goals.map((goalCat: Category) => {
                    const calc = calculateGoalProgress(goalCat, transactions);
                    return (
                      <div
                        key={goalCat.id}
                        className="p-3 rounded-md bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f]"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-medium text-xs text-[#37352f] dark:text-[#ecebed]">
                            {getCategoryName(goalCat, language)}
                          </h4>
                          <span
                            className={`text-[11px] text-[#787774] dark:text-[#9b9a97] tabular-nums transition-[filter] duration-200 ${
                              hideBalance ? 'privacy-blur' : ''
                            }`}
                          >
                            {formatMAD(calc.savedAmount, false, language)} /{' '}
                            {formatMAD(goalCat.targetAmount || 0, false, language)}
                          </span>
                        </div>
                        <GoalProgressBar
                          category={goalCat}
                          calc={calc}
                          hideBalance={hideBalance}
                          onContribute={() => handleOpenGoalContribution(goalCat.id)}
                          showContributeButton={true}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs sm:text-sm text-[#37352f] dark:text-[#ecebed]">
            {tDash.recentTransactions}
          </h3>
          <button
            onClick={() => setActiveScreen('history')}
            className="text-xs text-[#2383e2] hover:underline flex items-center gap-0.5"
          >
            <span>{tDash.seeAllTransactions}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title={tDash.noTransactions}
            description="Toutes vos entrées et sorties d'argent apparaîtront ici."
          />
        ) : (
          <div className="space-y-1">
            {recentTransactions.map((tx: Transaction) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                hideBalance={hideBalance}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Save Confirmation Modal ("Tout épargner") */}
      <Modal
        isOpen={isSaveAllModalOpen}
        onClose={() => setIsSaveAllModalOpen(false)}
        title={tDash.saveAllConfirmTitle}
        subtitle="Alimenter tous vos objectifs d'épargne en une seule fois"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#5f5e5b] dark:text-[#9b9a97] leading-relaxed">
            {tDash.saveAllConfirmDesc.replace(
              '{amount}',
              formatMAD(remainingToSaveThisMonth, false, language)
            )}
          </p>

          <div className="p-3 rounded-md bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] space-y-1.5">
            <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider block">
              Répartition prévue ce mois :
            </span>
            {activeGoalCategories.map((g) => {
              const calc = calculateGoalProgress(g, transactions);
              if (calc.status === 'completed' || calc.monthlyNeeded <= 0) return null;
              return (
                <div key={g.id} className="flex justify-between py-0.5">
                  <span className="text-[#37352f] dark:text-[#ecebed]">{getCategoryName(g, language)}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatMAD(calc.monthlyNeeded, false, language)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsSaveAllModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleExecuteSaveAll}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Confirmer tout épargner
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
      />
      <AddIncomeModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
      />
      <AddContributionModal
        isOpen={isContributionOpen}
        onClose={() => setIsContributionOpen(false)}
        defaultCategoryId={selectedGoalId}
      />
    </div>
  );
};
