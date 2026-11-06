import { Category, GoalCalculation, Language, Transaction, UserAccount, TaskItem, DebtItem, SubscriptionItem } from '../types';
import { getCategoryName } from './i18nHelpers';
import { getIntlLocale, isTransactionInMonth } from './formatters';

export function calculateAvailableBalance(initialBalance: number | null, transactions: Transaction[]): number {
  const base = typeof initialBalance === 'number' && !isNaN(initialBalance) ? initialBalance : 0;
  const raw = (transactions || []).reduce((acc, tx) => {
    const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : parseFloat(String(tx.amount || 0)) || 0;
    switch (tx.type) {
      case 'income': return acc + amt;
      case 'expense': return acc - amt;
      case 'contribution': return acc - amt;
      case 'goal_withdraw': return acc + amt;
      case 'adjustment': return acc + amt;
      default: return acc;
    }
  }, base);
  return Math.round(raw * 100) / 100;
}

export function calculateReconciledInitialBalance(targetBalance: number, transactions: Transaction[]): number {
  const netTxImpact = calculateAvailableBalance(0, transactions);
  return Math.round((targetBalance - netTxImpact) * 100) / 100;
}

export function reconcileIncomeAndInitialBalance(account: UserAccount): { account: UserAccount; changed: boolean; } {
  return { account, changed: false };
}

export function selectAvailableBalance(state: { initialBalance: number | null; transactions?: Transaction[]; balance?: number; }): number {
  const txs = state.transactions || [];
  if (txs.length > 0 || state.initialBalance !== null) return calculateAvailableBalance(state.initialBalance, txs);
  return typeof state.balance === 'number' && !isNaN(state.balance) ? state.balance : calculateAvailableBalance(state.initialBalance, txs);
}

export function calculateCategorySavedAmount(categoryId: string, transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.categoryId === categoryId)
    .reduce((acc, tx) => {
      if (tx.type === 'contribution') return acc + tx.amount;
      if (tx.type === 'goal_withdraw') return acc - tx.amount;
      return acc;
    }, 0);
}

export function calculateCategorySpentAmount(categoryId: string, transactions: Transaction[], month?: string): number {
  return transactions
    .filter((tx) => {
      if (tx.type !== 'expense' || tx.categoryId !== categoryId) return false;
      if (month && !isTransactionInMonth(tx.date, month)) return false;
      return true;
    })
    .reduce((acc, tx) => acc + tx.amount, 0);
}

export function calculateCategoryBudgetStatus(
  category: Category,
  spentThisMonth: number
): { hasBudget: boolean; budget: number; spent: number; remaining: number; percent: number; status: 'normal' | 'warning' | 'exceeded'; barColor: string; } {
  const budget = category.monthlyBudget || 0;
  if (!budget || budget <= 0) {
    return { hasBudget: false, budget: 0, spent: spentThisMonth, remaining: 0, percent: 0, status: 'normal', barColor: '#10b981' };
  }
  const percent = Math.min(100, Math.round((spentThisMonth / budget) * 100));
  const remaining = Math.max(0, budget - spentThisMonth);
  let status: 'normal' | 'warning' | 'exceeded' = 'normal';
  let barColor = '#10b981';
  if (spentThisMonth >= budget) { status = 'exceeded'; barColor = '#ef4444'; }
  else if (percent >= 80) { status = 'warning'; barColor = '#f59e0b'; }
  return { hasBudget: true, budget, spent: spentThisMonth, remaining, percent, status, barColor };
}

export function getKpiData(
  transactions: Transaction[],
  tasks: TaskItem[],
  debts: DebtItem[],
  subscriptions: SubscriptionItem[],
  selectedMonth: string,
  _language: Language = 'fr'
) {
  const currentMonth = selectedMonth;
  const lastMonth = new Date(Number(selectedMonth.slice(0, 4)), parseInt(selectedMonth.slice(5, 7)) - 1, 0).toISOString().slice(0, 7);
  const getMonthMetric = (monthKey: string, type: 'income' | 'expense' | 'contribution') => {
    return transactions.filter(tx => tx.type === type && isTransactionInMonth(tx.date, monthKey)).reduce((sum, tx) => sum + Number(tx.amount), 0);
  };
  const currentIncome = getMonthMetric(currentMonth, 'income');
  const lastIncome = getMonthMetric(lastMonth, 'income');
  const incomeChange = lastIncome !== 0 ? Math.round(((currentIncome - lastIncome) / lastIncome) * 100) : 0;
  const incomeCount = transactions.filter(tx => tx.type === 'income' && isTransactionInMonth(tx.date, currentMonth)).length;
  const currentExpense = getMonthMetric(currentMonth, 'expense');
  const lastExpense = getMonthMetric(lastMonth, 'expense');
  const expenseChange = lastExpense !== 0 ? Math.round(((currentExpense - lastExpense) / lastExpense) * 100) : 0;
  const daysInMonth = new Date(parseInt(currentMonth.slice(0, 4)), parseInt(currentMonth.slice(5, 7)), 0).getDate();
  const avgDailySpend = daysInMonth > 0 ? Math.round(currentExpense / daysInMonth) : 0;
  const currentSavings = getMonthMetric(currentMonth, 'contribution');
  const savingsRate = currentIncome > 0 ? Math.round((currentSavings / currentIncome) * 100) : 0;
  const netFlow = currentIncome - currentExpense;
  const netFlowColor = netFlow >= 0 ? 'emerald' : 'rose';
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completedDates.some(date => date.slice(0, 7) === currentMonth)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const owedToMe = debts.filter(d => d.type === 'lend' && !d.isSettled).reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0);
  const iOwe = debts.filter(d => d.type === 'borrow' && !d.isSettled).reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0);
  return {
    income: { value: currentIncome, change: incomeChange, count: incomeCount },
    expense: { value: currentExpense, change: expenseChange, avgDaily: avgDailySpend },
    netFlow: { value: netFlow, savingsRate, color: netFlowColor },
    tasks: { completionRate, activeStreak: 0 },
    debts: { netPosition: owedToMe - iOwe, unsettledCount: debts.filter(d => !d.isSettled).length },
    subscriptions: { total: subscriptions.reduce((sum, sub) => sum + sub.amount, 0), expensePercent: currentExpense > 0 ? Math.round((subscriptions.reduce((sum, sub) => sum + sub.amount, 0) / currentExpense) * 100) : 0 },
  };
}

export function calculateTotalSavingsInGoals(categories: Category[], transactions: Transaction[]): number {
  return categories.filter((cat) => cat.isGoal && cat.targetAmount && cat.targetAmount > 0).reduce((acc, cat) => acc + Math.max(0, calculateCategorySavedAmount(cat.id, transactions)), 0);
}

export function calculateNetWorth(initialBalance: number | null, transactions: Transaction[], categories: Category[]): number {
  return calculateAvailableBalance(initialBalance, transactions) + calculateTotalSavingsInGoals(categories, transactions);
}

export function calculateGoalProgress(category: Category, transactions: Transaction[]): GoalCalculation {
  const target = category.targetAmount || 0;
  const saved = Math.max(0, calculateCategorySavedAmount(category.id, transactions));
  const remainingAmount = Math.max(0, target - saved);
  const progressPercent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  let remainingMonths = 1;
  const now = new Date();
  if (category.targetDate) {
    remainingMonths = Math.max(1, Math.ceil((new Date(category.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
  } else if (category.targetMonths) {
    remainingMonths = Math.max(1, category.targetMonths - Math.max(0, (now.getFullYear() - new Date(category.createdAt).getFullYear()) * 12 + (now.getMonth() - new Date(category.createdAt).getMonth())));
  }
  const monthlyNeeded = remainingMonths > 0 ? Math.ceil(remainingAmount / remainingMonths) : remainingAmount;
  const totalMonths = category.targetMonths || 6;
  const expectedSoFar = (target / totalMonths) * Math.max(1, totalMonths - remainingMonths);
  return { savedAmount: saved, remainingAmount, progressPercent, remainingMonths, monthlyNeeded, status: saved >= target && target > 0 ? 'completed' : saved === 0 ? 'not_started' : saved >= expectedSoFar * 0.85 ? 'on_track' : 'behind' };
}

export function getMonthlyStats(transactions: Transaction[], monthsCount: number = 6, language: Language = 'fr') {
  const result: { monthKey: string; label: string; income: number; expense: number; savings: number; }[] = [];
  const now = new Date();
  const locale = getIntlLocale(language);
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter((tx) => isTransactionInMonth(tx.date, monthKey));
    result.push({
      monthKey,
      label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).charAt(0).toUpperCase() + new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).slice(1),
      income: monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      savings: monthTx.filter((t) => t.type === 'contribution').reduce((sum, t) => sum + t.amount, 0),
    });
  }
  return result;
}

export function getCategorySpendingBreakdown(categories: Category[], transactions: Transaction[], month?: string, language: Language = 'fr') {
  const spendingMap = new Map<string, number>();
  transactions.filter((tx) => tx.type === 'expense' && tx.categoryId && (!month || isTransactionInMonth(tx.date, month))).forEach((tx) => spendingMap.set(tx.categoryId!, (spendingMap.get(tx.categoryId!) || 0) + tx.amount));
  const totalExpense = Array.from(spendingMap.values()).reduce((a, b) => a + b, 0);
  const breakdown = categories.map((cat) => ({ id: cat.id, key: cat.key || cat.translationKey, translationKey: cat.translationKey || cat.key, name: getCategoryName(cat, language), color: cat.color, icon: cat.icon, amount: spendingMap.get(cat.id) || 0, percentage: totalExpense > 0 ? Math.round(((spendingMap.get(cat.id) || 0) / totalExpense) * 100) : 0 })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
  return { breakdown, totalExpense };
}
