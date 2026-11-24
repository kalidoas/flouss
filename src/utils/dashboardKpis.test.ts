import { describe, it, expect } from 'vitest';
import {
  selectMonthlyFinancialKpis,
  selectDailyBudgetKpi,
  selectCashRunwayKpi,
  selectUpcomingBillsKpi,
  selectDebtsDueKpi,
  selectBudgetUsageKpi,
  selectMomChangeKpi,
  selectTopCategoryKpi,
} from './dashboardKpis';
import { Category, DebtItem, SubscriptionItem, Transaction } from '../types';

function createTx(overrides: Partial<Transaction> & { id: string; amount: number; type: Transaction['type']; date: string }): Transaction {
  return {
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createCat(overrides: Partial<Category> & { id: string; name: string }): Category {
  return {
    color: '#6366f1',
    icon: 'tag',
    isGoal: false,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Dashboard KPIs - selectMonthlyFinancialKpis', () => {
  it('returns savingsRate: null when income is 0 (empty state)', () => {
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 150, type: 'expense', categoryId: 'food', date: '2026-11-05' }),
    ];
    const kpis = selectMonthlyFinancialKpis(1000, transactions, '2026-11');
    expect(kpis.income).toBe(0);
    expect(kpis.expenses).toBe(150);
    expect(kpis.net).toBe(-150);
    expect(kpis.savingsRate).toBeNull();
  });

  it('calculates savingsRate correctly when income > 0', () => {
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 10000, type: 'income', categoryId: 'salary', date: '2026-11-01' }),
      createTx({ id: '2', amount: 3000, type: 'expense', categoryId: 'rent', date: '2026-11-02' }),
    ];
    const kpis = selectMonthlyFinancialKpis(0, transactions, '2026-11');
    expect(kpis.income).toBe(10000);
    expect(kpis.expenses).toBe(3000);
    expect(kpis.net).toBe(7000);
    expect(kpis.savingsRate).toBe(70);
  });

  it('excludes adjustment transactions from Net and Savings rate, but includes them in Available balance', () => {
    const baseTransactions: Transaction[] = [
      createTx({ id: '1', amount: 10000, type: 'income', categoryId: 'salary', date: '2026-11-01' }),
      createTx({ id: '2', amount: 4000, type: 'expense', categoryId: 'rent', date: '2026-11-02' }),
    ];
    const baseKpis = selectMonthlyFinancialKpis(1000, baseTransactions, '2026-11');
    expect(baseKpis.balance).toBe(7000); // 1000 + 10000 - 4000
    expect(baseKpis.net).toBe(6000);
    expect(baseKpis.savingsRate).toBe(60);

    // Adding positive adjustment (+500)
    const withAdjustment: Transaction[] = [
      ...baseTransactions,
      createTx({ id: '3', amount: 500, type: 'adjustment', date: '2026-11-10' }),
    ];
    const adjustedKpis = selectMonthlyFinancialKpis(1000, withAdjustment, '2026-11');
    // Balance increases by 500
    expect(adjustedKpis.balance).toBe(7500);
    // Net and Savings rate remain completely unaffected by adjustment
    expect(adjustedKpis.net).toBe(6000);
    expect(adjustedKpis.savingsRate).toBe(60);

    // Adding negative adjustment (-800)
    const withNegAdjustment: Transaction[] = [
      ...baseTransactions,
      createTx({ id: '4', amount: -800, type: 'adjustment', date: '2026-11-12' }),
    ];
    const negAdjustedKpis = selectMonthlyFinancialKpis(1000, withNegAdjustment, '2026-11');
    // Balance decreases by 800
    expect(negAdjustedKpis.balance).toBe(6200);
    // Net and Savings rate remain unchanged
    expect(negAdjustedKpis.net).toBe(6000);
    expect(negAdjustedKpis.savingsRate).toBe(60);
  });
});

describe('Dashboard KPIs - selectDailyBudgetKpi', () => {
  it('returns dailyBudget: null when balance <= 0 (empty state)', () => {
    const result = selectDailyBudgetKpi(0, [], new Date('2026-11-15'));
    expect(result.dailyBudget).toBeNull();
  });

  it('returns dailyBudget: null when balance is negative', () => {
    const result = selectDailyBudgetKpi(-200, [], new Date('2026-11-15'));
    expect(result.dailyBudget).toBeNull();
  });

  it('deducts upcoming bills until month end from balance before dividing by days left', () => {
    // 2026-11 has 30 days. On Nov 15, days left = 30 - 15 + 1 = 16 days.
    const subs: SubscriptionItem[] = [
      {
        id: 'sub1',
        name: 'Internet',
        amount: 500,
        billingDay: 20,
        nextDueDate: '2026-11-20',
        category: 'bills',
        paidMonths: [],
        createdAt: '2026-01-01',
      },
    ];
    // balance: 2100. Upcoming bill: 500. Remaining: 1600. Days left: 16 -> dailyBudget: 100
    const result = selectDailyBudgetKpi(2100, subs, new Date(2026, 10, 15));
    expect(result.daysLeft).toBe(16);
    expect(result.upcomingBillsUntilMonthEnd).toBe(500);
    expect(result.dailyBudget).toBe(100);
  });

  it('returns dailyBudget: null when upcoming bills exceed available balance', () => {
    const subs: SubscriptionItem[] = [
      {
        id: 'sub1',
        name: 'Rent',
        amount: 3000,
        billingDay: 25,
        nextDueDate: '2026-11-25',
        category: 'rent',
        paidMonths: [],
        createdAt: '2026-01-01',
      },
    ];
    const result = selectDailyBudgetKpi(1000, subs, new Date(2026, 10, 15));
    expect(result.dailyBudget).toBeNull();
    expect(result.upcomingBillsUntilMonthEnd).toBe(3000);
  });
});

describe('Dashboard KPIs - selectCashRunwayKpi', () => {
  it('returns runwayDays: null when history is less than 14 days', () => {
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 100, type: 'expense', categoryId: 'food', date: '2026-11-01T10:00:00' }),
      createTx({ id: '2', amount: 200, type: 'expense', categoryId: 'food', date: '2026-11-05T10:00:00' }),
    ];
    const result = selectCashRunwayKpi(5000, transactions);
    expect(result.runwayDays).toBeNull();
    expect(result.hasEnoughHistory).toBe(false);
  });

  it('returns runwayDays: null when balance <= 0', () => {
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 100, type: 'expense', categoryId: 'food', date: '2026-10-01T10:00:00' }),
      createTx({ id: '2', amount: 100, type: 'expense', categoryId: 'food', date: '2026-10-20T10:00:00' }),
      createTx({ id: '3', amount: 100, type: 'expense', categoryId: 'food', date: '2026-11-01T10:00:00' }),
    ];
    const result = selectCashRunwayKpi(0, transactions);
    expect(result.runwayDays).toBeNull();
    expect(result.hasEnoughHistory).toBe(true);
  });

  it('calculates runway days accurately when history >= 14 days and burn > 0', () => {
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 1000, type: 'expense', categoryId: 'food', date: '2026-10-01T10:00:00' }),
      createTx({ id: '2', amount: 500, type: 'expense', categoryId: 'food', date: '2026-10-15T10:00:00' }),
      createTx({ id: '3', amount: 1500, type: 'expense', categoryId: 'food', date: '2026-10-31T10:00:00' }),
    ];
    const result = selectCashRunwayKpi(6000, transactions);
    expect(result.hasEnoughHistory).toBe(true);
    expect(result.runwayDays).toBeGreaterThan(50);
    expect(result.dailyBurn).toBeGreaterThan(0);
  });
});

describe('Dashboard KPIs - selectUpcomingBillsKpi', () => {
  it('returns empty items and 0 total when no subscriptions exist', () => {
    const result = selectUpcomingBillsKpi([], new Date('2026-11-01'));
    expect(result.items).toHaveLength(0);
    expect(result.total30Days).toBe(0);
    expect(result.count30Days).toBe(0);
  });

  it('returns sorted upcoming bills within 30 days and computes 30-day total', () => {
    const subs: SubscriptionItem[] = [
      {
        id: '1',
        name: 'Gym',
        amount: 300,
        billingDay: 25,
        nextDueDate: '2026-11-25',
        category: 'fitness',
        paidMonths: [],
        createdAt: '2026-01-01',
      },
      {
        id: '2',
        name: 'Netflix',
        amount: 100,
        billingDay: 5,
        nextDueDate: '2026-11-05',
        category: 'entertainment',
        paidMonths: [],
        createdAt: '2026-01-01',
      },
      {
        id: '3',
        name: 'Cloud',
        amount: 150,
        billingDay: 10,
        nextDueDate: '2026-11-10',
        category: 'software',
        paidMonths: [],
        createdAt: '2026-01-01',
      },
      {
        id: '4',
        name: 'Yearly Insurance',
        amount: 2000,
        billingDay: 1,
        nextDueDate: '2027-05-01',
        category: 'insurance',
        paidMonths: [],
        createdAt: '2026-01-01',
      },
    ];

    const result = selectUpcomingBillsKpi(subs, new Date(2026, 10, 1));
    expect(result.count30Days).toBe(3);
    expect(result.total30Days).toBe(550);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].name).toBe('Netflix');
    expect(result.items[1].name).toBe('Cloud');
    expect(result.items[2].name).toBe('Gym');
  });
});

describe('Dashboard KPIs - selectDebtsDueKpi', () => {
  it('keeps toPay and toReceive strictly separate, never summed', () => {
    const debts: DebtItem[] = [
      {
        id: '1',
        personName: 'Yassine',
        type: 'borrow', // I owe him (toPay)
        totalAmount: 1000,
        paidAmount: 200,
        createdAt: '2026-10-01',
        isSettled: false,
      },
      {
        id: '2',
        personName: 'Karim',
        type: 'lend', // He owes me (toReceive)
        totalAmount: 2500,
        paidAmount: 500,
        createdAt: '2026-10-01',
        isSettled: false,
      },
      {
        id: '3',
        personName: 'Said',
        type: 'borrow',
        totalAmount: 300,
        paidAmount: 300,
        createdAt: '2026-10-01',
        isSettled: true,
      },
    ];

    const result = selectDebtsDueKpi(debts);
    expect(result.toPayTotal).toBe(800); // 1000 - 200
    expect(result.toPayCount).toBe(1);
    expect(result.toReceiveTotal).toBe(2000); // 2500 - 500
    expect(result.toReceiveCount).toBe(1);
    expect(result.hasDebts).toBe(true);
  });

  it('returns 0 and hasDebts: false when all debts are settled', () => {
    const debts: DebtItem[] = [
      {
        id: '1',
        personName: 'Yassine',
        type: 'borrow',
        totalAmount: 500,
        paidAmount: 500,
        createdAt: '2026-10-01',
        isSettled: true,
      },
    ];
    const result = selectDebtsDueKpi(debts);
    expect(result.toPayTotal).toBe(0);
    expect(result.toReceiveTotal).toBe(0);
    expect(result.hasDebts).toBe(false);
  });
});

describe('Dashboard KPIs - selectBudgetUsageKpi', () => {
  it('returns hasBudgets: false and overallUsagePercent: null when no budgets are defined', () => {
    const categories: Category[] = [
      createCat({ id: '1', name: 'Food' }),
      createCat({ id: '2', name: 'Rent' }),
    ];
    const result = selectBudgetUsageKpi(categories, [], '2026-11');
    expect(result.hasBudgets).toBe(false);
    expect(result.overallUsagePercent).toBeNull();
    expect(result.categories).toHaveLength(0);
  });

  it('computes usage percent when budgets are configured', () => {
    const categories: Category[] = [
      createCat({ id: 'c1', name: 'Food', monthlyBudget: 2000 }),
      createCat({ id: 'c2', name: 'Leisure', monthlyBudget: 1000 }),
    ];
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 1500, type: 'expense', categoryId: 'c1', date: '2026-11-05' }),
      createTx({ id: '2', amount: 500, type: 'expense', categoryId: 'c2', date: '2026-11-10' }),
    ];
    const result = selectBudgetUsageKpi(categories, transactions, '2026-11');
    expect(result.hasBudgets).toBe(true);
    expect(result.overallUsagePercent).toBe(67);
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].percent).toBe(75);
    expect(result.categories[1].percent).toBe(50);
  });
});

describe('Dashboard KPIs - selectMomChangeKpi', () => {
  it('returns percentChange: null when previous month expenses were 0', () => {
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 1200, type: 'expense', categoryId: 'food', date: '2026-11-02' }),
    ];
    const result = selectMomChangeKpi(transactions, '2026-11', '2026-10');
    expect(result.currentExpenses).toBe(1200);
    expect(result.previousExpenses).toBe(0);
    expect(result.percentChange).toBeNull();
  });

  it('calculates percent change correctly when previous month had expenses', () => {
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 1000, type: 'expense', categoryId: 'food', date: '2026-10-15' }),
      createTx({ id: '2', amount: 1300, type: 'expense', categoryId: 'food', date: '2026-11-15' }),
    ];
    const result = selectMomChangeKpi(transactions, '2026-11', '2026-10');
    expect(result.percentChange).toBe(30); // +30%
    expect(result.diffAmount).toBe(300);
  });
});

describe('Dashboard KPIs - selectTopCategoryKpi', () => {
  it('returns null when no expenses exist for the month', () => {
    const result = selectTopCategoryKpi([], [], '2026-11');
    expect(result).toBeNull();
  });

  it('identifies top category and calculates percentage accurately', () => {
    const categories: Category[] = [
      createCat({ id: 'c1', name: 'Groceries' }),
      createCat({ id: 'c2', name: 'Transport' }),
    ];
    const transactions: Transaction[] = [
      createTx({ id: '1', amount: 800, type: 'expense', categoryId: 'c1', date: '2026-11-02' }),
      createTx({ id: '2', amount: 200, type: 'expense', categoryId: 'c2', date: '2026-11-04' }),
    ];
    const result = selectTopCategoryKpi(categories, transactions, '2026-11');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Groceries');
    expect(result?.amount).toBe(800);
    expect(result?.percentOfExpenses).toBe(80);
  });
});
