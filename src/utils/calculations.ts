import { Category, GoalCalculation, Language, Transaction, UserAccount } from '../types';
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
  const raw = (transactions || []).reduce((acc, tx) => {
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
  return Math.round(raw * 100) / 100;
}

/**
 * Calculate the required initial balance to reconcile to an exact target balance
 * without modifying any historical transactions.
 * Formula: targetBalance = initialBalance + netTxImpact
 *       => initialBalance = targetBalance - netTxImpact
 */
export function calculateReconciledInitialBalance(
  targetBalance: number,
  transactions: Transaction[]
): number {
  const netTxImpact = calculateAvailableBalance(0, transactions);
  return Math.round((targetBalance - netTxImpact) * 100) / 100;
}

/**
 * Reconcile user account:
 * 1. OVERRIDE TOTAL INCOMES: Find income transaction (e.g. 340 DH) and set value to 300 DH,
 *    categorized under "أعمال أخرى" (Other work).
 * 2. OVERRIDE CURRENT BALANCE: Adjust initialBalance so calculateAvailableBalance() outputs EXACTLY 231.5 DH.
 * 3. FIX ADDITION LOGIC: Ensure future additions strictly increase balance (e.g. +100 DH becomes 331.5 DH).
 * CRITICAL CONSTRAINT: NEVER delete, hide, or modify any expense transactions (15.40 DH Gel Douche, 150 DH Gym, etc.).
 */
export function reconcileIncomeAndInitialBalance(account: UserAccount): {
  account: UserAccount;
  changed: boolean;
} {
  if (!account) return { account, changed: false };

  // If already reconciled with the migration flag, skip to preserve user edits & future additions
  if (account.incomeBalanceFixedV1) {
    return { account, changed: false };
  }

  let changed = false;
  const currentTransactions = Array.isArray(account.transactions) ? [...account.transactions] : [];

  // Ensure "src_autre_travail" (أعمال أخرى) exists in incomeSources
  let updatedIncomeSources = Array.isArray(account.incomeSources) ? [...account.incomeSources] : [];
  if (!updatedIncomeSources.some((s) => s.id === 'src_autre_travail' || s.key === 'otherWork')) {
    updatedIncomeSources.push({
      id: 'src_autre_travail',
      key: 'otherWork',
      name: 'أعمال أخرى',
      icon: 'Briefcase',
      color: '#6366f1',
      isDefault: true,
      createdAt: new Date().toISOString(),
      subcategories: [
        { id: 'sub_inc_other_work', key: 'otherWork', name: 'أعمال أخرى', icon: 'Briefcase' },
      ],
    });
    changed = true;
  }

  // 1. OVERRIDE TOTAL INCOMES: Find income transaction (e.g. 340 DH) and set to 300 DH
  // CRITICAL: NEVER touch, delete, or modify any expense transactions (15.40 DH Gel Douche, 150 DH Gym, etc.)
  const incomeTxs = currentTransactions.filter((tx) => tx.type === 'income');
  const exact340Index = currentTransactions.findIndex(
    (tx) => tx.type === 'income' && (Math.abs(Number(tx.amount) - 340) < 0.01 || Number(tx.amount) === 340)
  );

  let updatedTransactions = currentTransactions;

  if (exact340Index !== -1) {
    updatedTransactions = currentTransactions.map((tx, idx) => {
      if (idx === exact340Index) {
        return {
          ...tx,
          amount: 300,
          sourceId: 'src_autre_travail',
          note: 'أعمال أخرى',
        };
      }
      return tx; // All expenses remain 100% untouched
    });
    changed = true;
  } else if (incomeTxs.length > 0) {
    let modifiedFirst = false;
    updatedTransactions = currentTransactions
      .map((tx) => {
        if (tx.type === 'income') {
          if (!modifiedFirst) {
            modifiedFirst = true;
            return {
              ...tx,
              amount: 300,
              sourceId: 'src_autre_travail',
              note: 'أعمال أخرى',
            };
          }
          return null as any;
        }
        return tx; // All expenses remain 100% untouched
      })
      .filter(Boolean);
    changed = true;
  } else {
    // No income transaction found: create the 300 DH income transaction
    const newIncome: Transaction = {
      id: 'tx_income_300',
      type: 'income',
      amount: 300,
      sourceId: 'src_autre_travail',
      note: 'أعمال أخرى',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    updatedTransactions = [newIncome, ...currentTransactions];
    changed = true;
  }

  // 2. OVERRIDE CURRENT BALANCE: Adjust initialBalance so calculateAvailableBalance outputs EXACTLY 231.5 DH
  const targetBalance = 231.5;
  const newInitialBalance = calculateReconciledInitialBalance(targetBalance, updatedTransactions);
  const calculatedBalance = calculateAvailableBalance(newInitialBalance, updatedTransactions);

  if (account.initialBalance !== newInitialBalance || account.balance !== targetBalance) {
    changed = true;
  }

  const updatedAccount: UserAccount = {
    ...account,
    incomeSources: updatedIncomeSources,
    transactions: updatedTransactions,
    initialBalance: newInitialBalance,
    balance: calculatedBalance, // Exactly 231.5 DH
    incomeBalanceFixedV1: true,
  };

  return { account: updatedAccount, changed };
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
