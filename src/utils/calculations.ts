import { Category, GoalCalculation, Language, Transaction } from '../types';
import { getCategoryName } from './i18nHelpers';
import { getIntlLocale } from './formatters';

/**
 * Calculate available cash balance.
 * Initial Balance + all Incomes - all Expenses - all Goal Contributions + all Goal Withdrawals
 */
export function calculateAvailableBalance(
  initialBalance: number | null,
  transactions: Transaction[]
): number {
  const base = typeof initialBalance === 'number' && !isNaN(initialBalance) ? initialBalance : 0;
  return (transactions || []).reduce((acc, tx) => {
    const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : parseFloat(String(tx.amount || 0)) || 0;
    switch (tx.type) {
      case 'income':
        return acc + amt;
      case 'expense':
        return acc - amt;
      case 'contribution':
        return acc - amt;
      case 'goal_withdraw':
        return acc + amt;
      default:
        return acc;
    }
  }, base);
}

/**
 * Single source of truth selector for available balance across WalletCard, AppleCardBalanceChart, etc.
 */
export function selectAvailableBalance(state: {
  initialBalance: number | null;
  transactions?: Transaction[];
  balance?: number;
}): number {
  const txs = state.transactions || [];
  if (txs.length > 0 || state.initialBalance !== null) {
    return calculateAvailableBalance(state.initialBalance, txs);
  }
  return typeof state.balance === 'number' && !isNaN(state.balance)
    ? state.balance
    : calculateAvailableBalance(state.initialBalance, txs);
}

/**
 * Calculate the amount saved in a specific category goal
 */
export function calculateCategorySavedAmount(
  categoryId: string,
  transactions: Transaction[]
): number {
  return transactions
    .filter((tx) => tx.categoryId === categoryId)
    .reduce((acc, tx) => {
      if (tx.type === 'contribution') return acc + tx.amount;
      if (tx.type === 'goal_withdraw') return acc - tx.amount;
      return acc;
    }, 0);
}

/**
 * Calculate total direct expenses in a category
 */
export function calculateCategorySpentAmount(
  categoryId: string,
  transactions: Transaction[],
  month?: string // "YYYY-MM" optional filter
): number {
  return transactions
    .filter((tx) => {
      if (tx.type !== 'expense' || tx.categoryId !== categoryId) return false;
      if (month && !tx.date.startsWith(month)) return false;
      return true;
    })
    .reduce((acc, tx) => acc + tx.amount, 0);
}

/**
 * Calculate monthly budget status for a category
 */
export function calculateCategoryBudgetStatus(
  category: Category,
  spentThisMonth: number
): {
  hasBudget: boolean;
  budget: number;
  spent: number;
  remaining: number;
  percent: number;
  status: 'normal' | 'warning' | 'exceeded';
  barColor: string;
} {
  const budget = category.monthlyBudget || 0;
  if (!budget || budget <= 0) {
    return {
      hasBudget: false,
      budget: 0,
      spent: spentThisMonth,
      remaining: 0,
      percent: 0,
      status: 'normal',
      barColor: '#10b981',
    };
  }

  const percent = Math.min(100, Math.round((spentThisMonth / budget) * 100));
  const remaining = Math.max(0, budget - spentThisMonth);

  let status: 'normal' | 'warning' | 'exceeded' = 'normal';
  let barColor = '#10b981'; // Green under 80%

  if (spentThisMonth >= budget) {
    status = 'exceeded';
    barColor = '#ef4444'; // Red at 100%
  } else if (percent >= 80) {
    status = 'warning';
    barColor = '#f59e0b'; // Orange at 80%
  }

  return {
    hasBudget: true,
    budget,
    spent: spentThisMonth,
    remaining,
    percent,
    status,
    barColor,
  };
}

/**
 * Calculate total money stored across all savings goals
 */
export function calculateTotalSavingsInGoals(
  categories: Category[],
  transactions: Transaction[]
): number {
  return categories
    .filter((cat) => cat.isGoal && cat.targetAmount && cat.targetAmount > 0)
    .reduce((acc, cat) => {
      const saved = calculateCategorySavedAmount(cat.id, transactions);
      return acc + Math.max(0, saved);
    }, 0);
}

/**
 * Calculate total net worth (Available cash + Savings in goals)
 */
export function calculateNetWorth(
  initialBalance: number | null,
  transactions: Transaction[],
  categories: Category[]
): number {
  const available = calculateAvailableBalance(initialBalance, transactions);
  const inGoals = calculateTotalSavingsInGoals(categories, transactions);
  return available + inGoals;
}

/**
 * Calculate detailed goal progress and recommendation
 */
export function calculateGoalProgress(
  category: Category,
  transactions: Transaction[]
): GoalCalculation {
  const target = category.targetAmount || 0;
  const saved = Math.max(0, calculateCategorySavedAmount(category.id, transactions));
  const remainingAmount = Math.max(0, target - saved);
  const progressPercent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

  // Determine remaining months
  let remainingMonths = 1;
  const now = new Date();

  if (category.targetDate) {
    const targetD = new Date(category.targetDate);
    const diffTime = targetD.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.4375));
    remainingMonths = Math.max(1, diffMonths);
  } else if (category.targetMonths) {
    const created = new Date(category.createdAt);
    const monthsPassed =
      (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    const left = category.targetMonths - Math.max(0, monthsPassed);
    remainingMonths = Math.max(1, left);
  }

  const monthlyNeeded =
    remainingMonths > 0 ? Math.ceil(remainingAmount / remainingMonths) : remainingAmount;

  // Determine status
  let status: GoalCalculation['status'] = 'not_started';
  if (saved >= target && target > 0) {
    status = 'completed';
  } else if (saved === 0) {
    status = 'not_started';
  } else {
    const totalMonths = category.targetMonths || 6;
    const elapsedMonths = Math.max(1, totalMonths - remainingMonths);
    const expectedPerMonth = target / totalMonths;
    const expectedSoFar = expectedPerMonth * elapsedMonths;
    status = saved >= expectedSoFar * 0.85 ? 'on_track' : 'behind';
  }

  return {
    savedAmount: saved,
    remainingAmount,
    progressPercent,
    remainingMonths,
    monthlyNeeded,
    status,
  };
}

/**
 * Get monthly statistics for the last N months (default 6)
 */
export function getMonthlyStats(
  transactions: Transaction[],
  monthsCount: number = 6,
  language: Language = 'fr'
) {
  const result: {
    monthKey: string;
    label: string;
    income: number;
    expense: number;
    savings: number;
  }[] = [];

  const now = new Date();
  const locale = getIntlLocale(language);

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    const monthLabel = new Intl.DateTimeFormat(locale, {
      month: 'short',
    }).format(d);

    const monthTx = transactions.filter((tx) => tx.date.startsWith(monthKey));

    const income = monthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = monthTx
      .filter((t) => t.type === 'contribution')
      .reduce((sum, t) => sum + t.amount, 0);

    result.push({
      monthKey,
      label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      income,
      expense,
      savings,
    });
  }

  return result;
}

/**
 * Calculate spending breakdown by category for a given month (or all time)
 */
export function getCategorySpendingBreakdown(
  categories: Category[],
  transactions: Transaction[],
  month?: string,
  language: Language = 'fr'
) {
  const spendingMap = new Map<string, number>();

  transactions
    .filter((tx) => {
      if (tx.type !== 'expense' || !tx.categoryId) return false;
      if (month && !tx.date.startsWith(month)) return false;
      return true;
    })
    .forEach((tx) => {
      const current = spendingMap.get(tx.categoryId!) || 0;
      spendingMap.set(tx.categoryId!, current + tx.amount);
    });

  const totalExpense = Array.from(spendingMap.values()).reduce((a, b) => a + b, 0);

  const breakdown = categories
    .map((cat) => {
      const amount = spendingMap.get(cat.id) || 0;
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        id: cat.id,
        name: getCategoryName(cat, language),
        color: cat.color,
        icon: cat.icon,
        amount,
        percentage,
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    breakdown,
    totalExpense,
  };
}
