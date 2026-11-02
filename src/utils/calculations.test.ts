import { describe, it, expect } from 'vitest';
import {
  calculateAvailableBalance,
  selectAvailableBalance,
  calculateCategorySavedAmount,
  calculateCategorySpentAmount,
  calculateCategoryBudgetStatus,
  calculateTotalSavingsInGoals,
  calculateNetWorth,
  calculateGoalProgress,
} from './calculations';
import { Category, Transaction } from '../types';

describe('calculateAvailableBalance', () => {
  it('correctly calculates balance with initial balance, income, expense, contribution, and goal_withdraw', () => {
    const transactions: Transaction[] = [
      { id: '1', type: 'income', amount: 1000, date: '2025-05-01', createdAt: '2025-05-01' },
      { id: '2', type: 'expense', amount: 200, date: '2025-05-02', createdAt: '2025-05-02' },
      { id: '3', type: 'contribution', amount: 300, date: '2025-05-03', createdAt: '2025-05-03' },
      { id: '4', type: 'goal_withdraw', amount: 150, date: '2025-05-04', createdAt: '2025-05-04' },
    ];

    // Initial 500 + 1000 (income) - 200 (expense) - 300 (contribution) + 150 (goal_withdraw) = 1150
    const balance = calculateAvailableBalance(500, transactions);
    expect(balance).toBe(1150);
  });

  it('handles null, undefined, or NaN initial balance gracefully', () => {
    const tx: Transaction[] = [
      { id: '1', type: 'income', amount: 500, date: '2025-05-01', createdAt: '2025-05-01' },
    ];
    expect(calculateAvailableBalance(null, tx)).toBe(500);
    expect(calculateAvailableBalance(undefined as unknown as null, tx)).toBe(500);
    expect(calculateAvailableBalance(NaN, tx)).toBe(500);
  });

  it('handles empty or undefined transactions gracefully', () => {
    expect(calculateAvailableBalance(1200, [])).toBe(1200);
    expect(calculateAvailableBalance(1200, undefined as unknown as Transaction[])).toBe(1200);
  });

  it('handles string amounts and NaN amounts inside transactions without crashing', () => {
    const dirtyTransactions = [
      { id: '1', type: 'income', amount: '450.5' as unknown as number, date: '2025-05-01', createdAt: '2025-05-01' },
      { id: '2', type: 'expense', amount: 'invalid' as unknown as number, date: '2025-05-02', createdAt: '2025-05-02' },
      { id: '3', type: 'expense', amount: NaN, date: '2025-05-03', createdAt: '2025-05-03' },
      { id: '4', type: 'expense', amount: 50.5, date: '2025-05-04', createdAt: '2025-05-04' },
    ] as Transaction[];

    // 0 + 450.5 - 0 - 0 - 50.5 = 400
    expect(calculateAvailableBalance(0, dirtyTransactions)).toBe(400);
  });
});

describe('selectAvailableBalance', () => {
  it('prefers mathematically computed live balance when transactions or initial balance are present', () => {
    const transactions: Transaction[] = [
      { id: '1', type: 'income', amount: 800, date: '2025-05-01', createdAt: '2025-05-01' },
    ];
    const result = selectAvailableBalance({
      initialBalance: 200,
      transactions,
      balance: 9999, // Should be overridden by calculated 1000
    });
    expect(result).toBe(1000);
  });

  it('falls back to store balance if no transactions and initial balance is null', () => {
    const result = selectAvailableBalance({
      initialBalance: null,
      transactions: [],
      balance: 750,
    });
    expect(result).toBe(750);
  });
});

describe('calculateCategorySavedAmount', () => {
  it('correctly tracks net contributions and withdrawals for a specific category', () => {
    const categoryId = 'cat_pc';
    const txs: Transaction[] = [
      { id: '1', type: 'contribution', categoryId: 'cat_pc', amount: 1500, date: '2025-05-01', createdAt: '2025-05-01' },
      { id: '2', type: 'contribution', categoryId: 'cat_pc', amount: 500, date: '2025-05-02', createdAt: '2025-05-02' },
      { id: '3', type: 'goal_withdraw', categoryId: 'cat_pc', amount: 300, date: '2025-05-03', createdAt: '2025-05-03' },
      { id: '4', type: 'contribution', categoryId: 'cat_other', amount: 800, date: '2025-05-04', createdAt: '2025-05-04' },
    ];

    expect(calculateCategorySavedAmount(categoryId, txs)).toBe(1700);
    expect(calculateCategorySavedAmount('cat_other', txs)).toBe(800);
    expect(calculateCategorySavedAmount('cat_empty', txs)).toBe(0);
  });
});

describe('calculateCategorySpentAmount', () => {
  it('calculates expenses for a category, with optional month filtering', () => {
    const txs: Transaction[] = [
      { id: '1', type: 'expense', categoryId: 'cat_food', amount: 120, date: '2025-04-15', createdAt: '2025-04-15' },
      { id: '2', type: 'expense', categoryId: 'cat_food', amount: 80, date: '2025-05-02', createdAt: '2025-05-02' },
      { id: '3', type: 'expense', categoryId: 'cat_food', amount: 200, date: '2025-05-18', createdAt: '2025-05-18' },
      { id: '4', type: 'income', categoryId: 'cat_food', amount: 500, date: '2025-05-01', createdAt: '2025-05-01' },
    ];

    // All time expenses for cat_food = 120 + 80 + 200 = 400
    expect(calculateCategorySpentAmount('cat_food', txs)).toBe(400);

    // Filtered by 2025-05 = 80 + 200 = 280
    expect(calculateCategorySpentAmount('cat_food', txs, '2025-05')).toBe(280);

    // Filtered by 2025-04 = 120
    expect(calculateCategorySpentAmount('cat_food', txs, '2025-04')).toBe(120);
  });
});

describe('calculateCategoryBudgetStatus', () => {
  const baseCategory: Category = {
    id: 'cat_groceries',
    name: 'Groceries',
    icon: 'Utensils',
    color: '#10b981',
    isGoal: false,
    isArchived: false,
    createdAt: '2025-01-01',
    monthlyBudget: 1000,
  };

  it('returns hasBudget: false if category has no monthly budget', () => {
    const noBudgetCat: Category = { ...baseCategory, monthlyBudget: null };
    const res = calculateCategoryBudgetStatus(noBudgetCat, 350);
    expect(res.hasBudget).toBe(false);
    expect(res.status).toBe('normal');
    expect(res.spent).toBe(350);
  });

  it('returns normal status when spent is below 80%', () => {
    const res = calculateCategoryBudgetStatus(baseCategory, 600);
    expect(res.hasBudget).toBe(true);
    expect(res.status).toBe('normal');
    expect(res.percent).toBe(60);
    expect(res.remaining).toBe(400);
    expect(res.barColor).toBe('#10b981');
  });

  it('returns warning status when spent is between 80% and 99%', () => {
    const res = calculateCategoryBudgetStatus(baseCategory, 850);
    expect(res.hasBudget).toBe(true);
    expect(res.status).toBe('warning');
    expect(res.percent).toBe(85);
    expect(res.remaining).toBe(150);
    expect(res.barColor).toBe('#f59e0b');
  });

  it('returns exceeded status when spent reaches or exceeds 100%', () => {
    const res = calculateCategoryBudgetStatus(baseCategory, 1200);
    expect(res.hasBudget).toBe(true);
    expect(res.status).toBe('exceeded');
    expect(res.percent).toBe(100);
    expect(res.remaining).toBe(0);
    expect(res.barColor).toBe('#ef4444');
  });
});

describe('calculateNetWorth & calculateTotalSavingsInGoals', () => {
  it('computes net worth as available cash + total saved across goals', () => {
    const categories: Category[] = [
      { id: 'goal_car', name: 'Car', icon: 'Car', color: '#3b82f6', isGoal: true, targetAmount: 50000, isArchived: false, createdAt: '2025-01-01' },
      { id: 'cat_rent', name: 'Rent', icon: 'Home', color: '#10b981', isGoal: false, isArchived: false, createdAt: '2025-01-01' },
    ];

    const transactions: Transaction[] = [
      { id: '1', type: 'income', amount: 10000, date: '2025-05-01', createdAt: '2025-05-01' },
      { id: '2', type: 'contribution', categoryId: 'goal_car', amount: 3000, date: '2025-05-02', createdAt: '2025-05-02' },
      { id: '3', type: 'expense', categoryId: 'cat_rent', amount: 2000, date: '2025-05-03', createdAt: '2025-05-03' },
    ];

    // Initial 5000:
    // Available cash = 5000 + 10000 (inc) - 3000 (contrib) - 2000 (exp) = 10000
    // Savings in goals = 3000
    // Net worth = 10000 + 3000 = 13000
    expect(calculateTotalSavingsInGoals(categories, transactions)).toBe(3000);
    expect(calculateNetWorth(5000, transactions, categories)).toBe(13000);
  });
});

describe('calculateGoalProgress', () => {
  it('returns completed when savedAmount >= targetAmount', () => {
    const goalCat: Category = {
      id: 'goal_laptop',
      name: 'MacBook',
      icon: 'Laptop',
      color: '#6366f1',
      isGoal: true,
      targetAmount: 12000,
      targetMonths: 6,
      isArchived: false,
      createdAt: '2025-01-01',
    };

    const txs: Transaction[] = [
      { id: '1', type: 'contribution', categoryId: 'goal_laptop', amount: 12000, date: '2025-05-01', createdAt: '2025-05-01' },
    ];

    const progress = calculateGoalProgress(goalCat, txs);
    expect(progress.savedAmount).toBe(12000);
    expect(progress.remainingAmount).toBe(0);
    expect(progress.progressPercent).toBe(100);
    expect(progress.status).toBe('completed');
  });

  it('returns not_started when savedAmount is 0', () => {
    const goalCat: Category = {
      id: 'goal_trip',
      name: 'Trip',
      icon: 'Plane',
      color: '#ec4899',
      isGoal: true,
      targetAmount: 5000,
      targetMonths: 5,
      isArchived: false,
      createdAt: '2025-01-01',
    };

    const progress = calculateGoalProgress(goalCat, []);
    expect(progress.savedAmount).toBe(0);
    expect(progress.remainingAmount).toBe(5000);
    expect(progress.progressPercent).toBe(0);
    expect(progress.status).toBe('not_started');
  });
});
