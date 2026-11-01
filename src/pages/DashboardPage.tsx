import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { PriorityHub } from '../components/dashboard/PriorityHub';
import { WalletCard } from '../components/dashboard/WalletCard';
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
    balance: storeBalance,
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
  const tCommon = translations[language].common;

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [isSaveAllModalOpen, setIsSaveAllModalOpen] = useState(false);

  const currentMonth = getCurrentMonthStr();
  const today = new Date();
  const currentDayOfMonth = today.getDate();

  // Metrics - Strictly prioritize the globally synced store balance
  const balance =
    typeof storeBalance === 'number' && !isNaN(storeBalance)
      ? storeBalance
      : calculateAvailableBalance(initialBalance, transactions);
  const totalInGoals = calculateTotalSavingsInGoals(categories, transactions);
  const netWorth = balance + totalInGoals;

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
    <div className="max-w-4xl mx-auto space-y-6 animate-page select-text">
      {/* Recurring Income Due Banner */}
      {dueRecurringRule && dueSource && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-xl shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-white tracking-tight">
                {tDash.recurringBannerTitle}
              </h4>
              <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                {tDash.recurringBannerDesc
                  .replace('{source}', getIncomeSourceName(dueSource, language))
                  .replace('{amount}', formatMAD(dueRecurringRule.amount, false, language))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => dismissRecurringPrompt(currentMonth)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
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
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{tDash.confirmRecurring}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Apple Bento Centerpiece: 2/3 Priority & Pinned Hub + 1/3 Compact Apple Wallet Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Priority & Pinned Hub Centerpiece (2/3 width) */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          <PriorityHub />
        </div>

        {/* Compact Apple Wallet Card (1/3 width) */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <WalletCard
            balance={balance}
            incomeThisMonth={incomeThisMonth}
            expenseThisMonth={expenseThisMonth}
            onOpenIncome={() => setIsIncomeOpen(true)}
            onOpenExpense={() => setIsExpenseOpen(true)}
            onOpenGoal={() => handleOpenGoalContribution()}
          />
        </div>
      </div>

      {/* Notion Focus View: "Ma liste" Section */}
      <FocusTaskList />

      {/* Monthly Savings Reminder Card */}
      {totalMonthlyGoalTarget > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <PiggyBank className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm tracking-tight">
                  {tDash.savingsReminderTitle} :{' '}
                  <span
                    className={`font-bold tabular-nums text-emerald-600 dark:text-emerald-400 transition-[filter] duration-200 ${
                      hideBalance ? 'privacy-blur' : ''
                    }`}
                  >
                    {formatMAD(totalMonthlyGoalTarget, false, language)}
                  </span>
                </h4>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {tDash.monthlyTargetCompleted}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Month Flow Overview: Income vs Expense Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-medium">{tDash.incomeThisMonth}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            +{formatMAD(incomeThisMonth, false, language)}
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block tabular-nums">
            {tDash.incomeCount.replace(
              '{count}',
              String(currentMonthTx.filter((t: Transaction) => t.type === 'income').length)
            )}
          </span>
        </div>

        <div className="rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-medium">{tDash.expensesThisMonth}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
            -{formatMAD(expenseThisMonth, false, language)}
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block tabular-nums">
            {tDash.expenseCount.replace(
              '{count}',
              String(currentMonthTx.filter((t: Transaction) => t.type === 'expense').length)
            )}
          </span>
        </div>
      </div>

      {/* Two Column Grid: Spending Donut + Top Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Spending Breakdown Donut (5 cols) */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white tracking-tight">
                  {tDash.spendingBreakdown}
                </h3>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {tDash.thisMonth}
                </span>
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
                          formatter={(value: number) => [
                            formatMAD(value, false, language),
                            tDash.expenseCategory,
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            backgroundColor: '#18181b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ffffff',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        Total
                      </span>
                      <span
                        className={`text-xs font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight transition-[filter] duration-200 ${
                          hideBalance ? 'privacy-blur' : ''
                        }`}
                      >
                        {formatMAD(monthlyTotalExpense, false, language)}
                      </span>
                    </div>
                  </div>

                  {/* Top Spending Items list */}
                  <div className="space-y-1.5 mt-2">
                    {spendingBreakdown.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-[11px] tabular-nums">
                            {item.percentage}%
                          </span>
                          <span
                            className={`font-semibold text-zinc-900 dark:text-white tabular-nums tracking-tight transition-[filter] duration-200 ${
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
          </div>
        </div>

        {/* Top Goals (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white tracking-tight">
                    {tDash.topGoals}
                  </h3>
                  {top3Goals.length > 0 && (
                    <span className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-mono tabular-nums">
                      {top3Goals.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveScreen('categories')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  <span>{tDash.seeAllGoals}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
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
                        className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.05]"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-semibold text-xs text-zinc-900 dark:text-white">
                            {getCategoryName(goalCat, language)}
                          </h4>
                          <span
                            className={`text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums transition-[filter] duration-200 ${
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
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white tracking-tight">
            {tDash.recentTransactions}
          </h3>
          <button
            onClick={() => setActiveScreen('history')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium"
          >
            <span>{tDash.seeAllTransactions}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title={tDash.noTransactions}
            description={tDash.allTransactionsDescription}
          />
        ) : (
          <div className="space-y-1.5">
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
        subtitle={tDash.saveAllModalSubtitle}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {tDash.saveAllConfirmDesc.replace(
              '{amount}',
              formatMAD(remainingToSaveThisMonth, false, language)
            )}
          </p>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.05] space-y-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              {tDash.plannedDistribution}
            </span>
            {activeGoalCategories.map((g) => {
              const calc = calculateGoalProgress(g, transactions);
              if (calc.status === 'completed' || calc.monthlyNeeded <= 0) return null;
              return (
                <div key={g.id} className="flex justify-between py-0.5">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {getCategoryName(g, language)}
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
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
              {tCommon.cancel}
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleExecuteSaveAll}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              {tDash.saveAllButton}
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
