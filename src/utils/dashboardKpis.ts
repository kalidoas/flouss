/**
 * Pure Dashboard KPI Selectors
 * Computes all financial metrics from existing store data.
 * Zero side-effects, fully testable, supports strict empty-state requirements.
 */

import { Category, DebtItem, SubscriptionItem, Transaction } from '../types';
import {
  calculateAvailableBalance,
  selectFinancialSummary,
  calculateCategorySpentAmount,
  calculateCategoryBudgetStatus,
} from './calculations';
import { hasTwoWeeksOfData } from './dashboard';
import { calculateNextDueDate } from './subscriptions';
import { getCurrentMonthStr, getTodayDateStr } from './formatters';

export interface MonthlyFinancialKpis {
  balance: number;
  income: number;
  expenses: number;
  net: number;
  /** Savings rate percentage: null if income <= 0 (empty state) */
  savingsRate: number | null;
}

/**
 * 1. Available balance, Income, Expenses, Net, and Savings rate for the target month.
 * Savings rate returns null (displays "—") when income <= 0.
 */
export function selectMonthlyFinancialKpis(
  initialBalance: number | null,
  transactions: Transaction[] = [],
  month: string = getCurrentMonthStr()
): MonthlyFinancialKpis {
  const balance = calculateAvailableBalance(initialBalance, transactions);
  // Net and Savings rate exclude balance adjustments (they only reconcile balance with bank)
  const summary = selectFinancialSummary(transactions, { month, includeAdjustments: false });

  const savingsRate =
    summary.income > 0
      ? Math.round((summary.net / summary.income) * 100)
      : null;

  return {
    balance,
    income: summary.income,
    expenses: summary.expenses,
    net: summary.net,
    savingsRate,
  };
}

export interface DailyBudgetKpi {
  /** Daily safe-to-spend budget: null if balance <= 0 or remaining funds <= 0 */
  dailyBudget: number | null;
  daysLeft: number;
  upcomingBillsUntilMonthEnd: number;
}

/**
 * 2. Safe-to-spend / Daily budget.
 * Formula: (balance - upcoming bills for remainder of the month) / days left.
 * Never negative. Returns null if balance <= 0 or net remaining funds <= 0.
 */
export function selectDailyBudgetKpi(
  balance: number,
  subscriptions: SubscriptionItem[] = [],
  now: Date = new Date()
): DailyBudgetKpi {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  const todayStr = `${currentMonthStr}-${String(now.getDate()).padStart(2, '0')}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);

  if (balance <= 0) {
    return { dailyBudget: null, daysLeft, upcomingBillsUntilMonthEnd: 0 };
  }

  // Calculate upcoming subscriptions due between today and month end
  let upcomingBillsUntilMonthEnd = 0;
  for (const sub of subscriptions) {
    if (sub.endDate && sub.endDate < todayStr) continue;

    const nextDue = sub.nextDueDate || calculateNextDueDate(sub, now);
    const isPaid =
      Boolean(sub.payments?.some((p) => p.cycleDate === nextDue)) ||
      Boolean(sub.paidMonths?.includes(nextDue.slice(0, 7)));

    if (!isPaid && nextDue >= todayStr && nextDue.startsWith(currentMonthStr)) {
      upcomingBillsUntilMonthEnd += Number(sub.amount) || 0;
    }
  }

  const remainingFunds = balance - upcomingBillsUntilMonthEnd;
  if (remainingFunds <= 0) {
    return {
      dailyBudget: null,
      daysLeft,
      upcomingBillsUntilMonthEnd: Math.round(upcomingBillsUntilMonthEnd * 100) / 100,
    };
  }

  const dailyBudget = Math.round((remainingFunds / daysLeft) * 100) / 100;
  return {
    dailyBudget,
    daysLeft,
    upcomingBillsUntilMonthEnd: Math.round(upcomingBillsUntilMonthEnd * 100) / 100,
  };
}

export interface CashRunwayKpi {
  /** Days of runway: null if history < 14 days, balance <= 0, or daily burn <= 0 */
  runwayDays: number | null;
  dailyBurn: number;
  historyDays: number;
  hasEnoughHistory: boolean;
}

/**
 * 3. Cash Runway.
 * Computes average daily expense across history and returns days of available balance.
 * Requires at least 14 days of transaction history.
 */
export function selectCashRunwayKpi(
  balance: number,
  transactions: Transaction[] = []
): CashRunwayKpi {
  const hasHistory = hasTwoWeeksOfData(transactions);
  if (!hasHistory || balance <= 0) {
    return {
      runwayDays: null,
      dailyBurn: 0,
      historyDays: 0,
      hasEnoughHistory: hasHistory,
    };
  }

  const timestamps = transactions
    .map((t) => Date.parse(t.date))
    .filter((ts) => Number.isFinite(ts));

  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const historyDays = Math.max(14, Math.round((maxTs - minTs) / (86400 * 1000)) + 1);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const dailyBurn = totalExpenses / historyDays;
  if (dailyBurn <= 0) {
    return {
      runwayDays: null,
      dailyBurn: 0,
      historyDays,
      hasEnoughHistory: true,
    };
  }

  const runwayDays = Math.round(balance / dailyBurn);
  return {
    runwayDays,
    dailyBurn: Math.round(dailyBurn * 100) / 100,
    historyDays,
    hasEnoughHistory: true,
  };
}

export interface UpcomingBillItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysUntil: number;
}

export interface UpcomingBillsKpi {
  items: UpcomingBillItem[];
  total30Days: number;
  count30Days: number;
}

/**
 * 4. Upcoming Bills / Subscriptions.
 * Returns the next 3 items due, plus 30-day total and count.
 */
export function selectUpcomingBillsKpi(
  subscriptions: SubscriptionItem[] = [],
  now: Date = new Date()
): UpcomingBillsKpi {
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = getTodayDateStr();

  const dueItems: UpcomingBillItem[] = [];
  let total30Days = 0;

  for (const sub of subscriptions) {
    if (sub.endDate && sub.endDate < todayStr) continue;

    const nextDue = sub.nextDueDate || calculateNextDueDate(sub, now);
    const isPaid =
      Boolean(sub.payments?.some((p) => p.cycleDate === nextDue)) ||
      Boolean(sub.paidMonths?.includes(nextDue.slice(0, 7)));

    if (isPaid) continue;

    const [y, m, d] = nextDue.split('-').map(Number);
    if (!y || !m || !d) continue;

    const dueUtc = Date.UTC(y, m - 1, d);
    const daysUntil = Math.round((dueUtc - todayUtc) / (86400 * 1000));

    // Include overdue or due within next 30 days
    if (daysUntil <= 30) {
      const amount = Number(sub.amount) || 0;
      total30Days += amount;
      dueItems.push({
        id: sub.id,
        name: sub.name,
        amount,
        dueDate: nextDue,
        daysUntil,
      });
    }
  }

  dueItems.sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    items: dueItems.slice(0, 3),
    total30Days: Math.round(total30Days * 100) / 100,
    count30Days: dueItems.length,
  };
}

export interface DebtsDueKpi {
  toPayTotal: number;
  toPayCount: number;
  toReceiveTotal: number;
  toReceiveCount: number;
  hasDebts: boolean;
}

/**
 * 5. Debts Due.
 * Keeps "to pay" (borrow) and "to receive" (lend) strictly separate, never summed.
 */
export function selectDebtsDueKpi(debts: DebtItem[] = []): DebtsDueKpi {
  let toPayTotal = 0;
  let toPayCount = 0;
  let toReceiveTotal = 0;
  let toReceiveCount = 0;

  for (const debt of debts) {
    if (debt.isSettled) continue;

    const remaining = Math.max(0, (Number(debt.totalAmount) || 0) - (Number(debt.paidAmount) || 0));
    if (remaining <= 0) continue;

    if (debt.type === 'borrow') {
      toPayTotal += remaining;
      toPayCount += 1;
    } else if (debt.type === 'lend') {
      toReceiveTotal += remaining;
      toReceiveCount += 1;
    }
  }

  return {
    toPayTotal: Math.round(toPayTotal * 100) / 100,
    toPayCount,
    toReceiveTotal: Math.round(toReceiveTotal * 100) / 100,
    toReceiveCount,
    hasDebts: toPayCount > 0 || toReceiveCount > 0,
  };
}

export interface CategoryBudgetUsageItem {
  id: string;
  name: string;
  budget: number;
  spent: number;
  percent: number;
  status: 'normal' | 'warning' | 'exceeded';
}

export interface BudgetUsageKpi {
  hasBudgets: boolean;
  overallUsagePercent: number | null;
  totalBudgeted: number;
  totalSpentBudgeted: number;
  categories: CategoryBudgetUsageItem[];
}

/**
 * 6. Category Budget Usage.
 * Returns overallUsagePercent: null when no categories have budgets defined (empty state).
 */
export function selectBudgetUsageKpi(
  categories: Category[] = [],
  transactions: Transaction[] = [],
  month: string = getCurrentMonthStr()
): BudgetUsageKpi {
  const budgetedCategories = categories.filter(
    (c) => !c.isArchived && !c.isGoal && typeof c.monthlyBudget === 'number' && c.monthlyBudget > 0
  );

  if (budgetedCategories.length === 0) {
    return {
      hasBudgets: false,
      overallUsagePercent: null,
      totalBudgeted: 0,
      totalSpentBudgeted: 0,
      categories: [],
    };
  }

  let totalBudgeted = 0;
  let totalSpentBudgeted = 0;
  const items: CategoryBudgetUsageItem[] = [];

  for (const cat of budgetedCategories) {
    const budget = Number(cat.monthlyBudget) || 0;
    const spent = calculateCategorySpentAmount(cat.id, transactions, month);
    const budgetStatus = calculateCategoryBudgetStatus(cat, spent);
    const percent = Math.round((spent / budget) * 100);

    totalBudgeted += budget;
    totalSpentBudgeted += spent;

    items.push({
      id: cat.id,
      name: cat.name,
      budget,
      spent,
      percent,
      status: budgetStatus.status,
    });
  }

  const overallUsagePercent =
    totalBudgeted > 0 ? Math.round((totalSpentBudgeted / totalBudgeted) * 100) : null;

  return {
    hasBudgets: true,
    overallUsagePercent,
    totalBudgeted: Math.round(totalBudgeted * 100) / 100,
    totalSpentBudgeted: Math.round(totalSpentBudgeted * 100) / 100,
    categories: items,
  };
}

export interface MomChangeKpi {
  percentChange: number | null;
  diffAmount: number;
  currentExpenses: number;
  previousExpenses: number;
}

/**
 * 7. Month-over-Month Expense Change.
 * Returns percentChange: null when previous month expenses were 0.
 */
export function selectMomChangeKpi(
  transactions: Transaction[] = [],
  currentMonth: string = getCurrentMonthStr(),
  previousMonth?: string
): MomChangeKpi {
  if (!previousMonth) {
    const [y, m] = currentMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  }

  const curExpenses = selectFinancialSummary(transactions, { month: currentMonth }).expenses;
  const prevExpenses = selectFinancialSummary(transactions, { month: previousMonth }).expenses;

  const diffAmount = Math.round((curExpenses - prevExpenses) * 100) / 100;
  const percentChange =
    prevExpenses > 0 ? Math.round((diffAmount / prevExpenses) * 100) : null;

  return {
    percentChange,
    diffAmount,
    currentExpenses: curExpenses,
    previousExpenses: prevExpenses,
  };
}

export interface TopCategoryKpi {
  categoryId: string;
  name: string;
  amount: number;
  percentOfExpenses: number;
}

/**
 * 8. Top Spending Category for the month.
 * Returns null if no expenses are recorded this month.
 */
export function selectTopCategoryKpi(
  categories: Category[] = [],
  transactions: Transaction[] = [],
  month: string = getCurrentMonthStr()
): TopCategoryKpi | null {
  const expenses = transactions.filter(
    (t) => t.type === 'expense' && t.date?.startsWith(month)
  );

  if (expenses.length === 0) return null;

  const categoryTotals = new Map<string, number>();
  let totalExpenses = 0;

  for (const t of expenses) {
    const amt = Number(t.amount) || 0;
    if (amt <= 0) continue;
    totalExpenses += amt;
    const catId = t.categoryId || 'uncategorized';
    categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + amt);
  }

  if (totalExpenses <= 0 || categoryTotals.size === 0) return null;

  let topId = '';
  let topAmount = 0;

  for (const [id, sum] of categoryTotals.entries()) {
    if (sum > topAmount) {
      topAmount = sum;
      topId = id;
    }
  }

  const catObj = categories.find((c) => c.id === topId);
  const name = catObj?.name || 'Uncategorized';
  const percentOfExpenses = Math.round((topAmount / totalExpenses) * 100);

  return {
    categoryId: topId,
    name,
    amount: Math.round(topAmount * 100) / 100,
    percentOfExpenses,
  };
}
