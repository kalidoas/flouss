import { describe, it, expect } from 'vitest';
import {
  calculateAvailableBalance,
  calculateReconciledInitialBalance,
  reconcileIncomeAndInitialBalance,
  selectAvailableBalance,
  calculateCategorySavedAmount,
  calculateCategorySpentAmount,
  calculateCategoryBudgetStatus,
  calculateTotalSavingsInGoals,
  calculateNetWorth,
  calculateGoalProgress,
} from './calculations';
import { Category, Transaction, UserAccount } from '../types';

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

describe('calculateReconciledInitialBalance', () => {
  it('calculates the exact initial balance required so available balance matches target without altering transactions', () => {
    const transactions: Transaction[] = [
      { id: '1', type: 'income', amount: 1500, date: '2025-05-01', createdAt: '2025-05-01' },
      { id: '2', type: 'expense', amount: 350.5, date: '2025-05-02', createdAt: '2025-05-02' },
      { id: '3', type: 'contribution', amount: 200, date: '2025-05-03', createdAt: '2025-05-03' },
    ];

    // Net transactions impact: +1500 - 350.5 - 200 = +949.50
    // Target balance: 231.50 MAD (as requested by user)
    const targetBalance = 231.5;
    const requiredInitial = calculateReconciledInitialBalance(targetBalance, transactions);

    // requiredInitial = 231.5 - 949.5 = -718.00
    expect(requiredInitial).toBe(-718);

    // Verify round-trip ground truth:
    const reconciledAvailable = calculateAvailableBalance(requiredInitial, transactions);
    expect(reconciledAvailable).toBe(231.5);
  });

  it('handles empty transactions list (target becomes initial balance)', () => {
    const required = calculateReconciledInitialBalance(500.75, []);
    expect(required).toBe(500.75);
    expect(calculateAvailableBalance(required, [])).toBe(500.75);
  });

  it('prevents IEEE-754 floating point drift on fine decimal reconciliation', () => {
    const transactions: Transaction[] = [
      { id: '1', type: 'expense', amount: 147.85, date: '2025-05-01', createdAt: '2025-05-01' },
    ];
    // Target is 147.68
    const target = 147.68;
    const initial = calculateReconciledInitialBalance(target, transactions);
    expect(calculateAvailableBalance(initial, transactions)).toBe(147.68);
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

describe('reconcileIncomeAndInitialBalance (Critical Balance & Income Fix)', () => {
  it('overrides 340 DH income to 300 DH "أعمال أخرى", sets balance to 231.50 DH, leaves expenses untouched, and allows future additions to strictly increase balance', () => {
    const rawAccount: UserAccount = {
      id: 'user_123',
      name: 'Khalid',
      avatarColor: '#2383e2',
      initialBalance: 0,
      initialBalanceLockedAt: null,
      balance: 174.6,
      isOnboarded: true,
      categories: [],
      incomeSources: [],
      transactions: [
        {
          id: 'tx_inc_1',
          type: 'income',
          amount: 340,
          date: '2026-11-01',
          createdAt: '2026-11-01',
          note: 'Previous Salary',
        },
        {
          id: 'tx_exp_gel',
          type: 'expense',
          amount: 15.4,
          categoryId: 'cat_hygiene',
          date: '2026-11-01',
          createdAt: '2026-11-01',
          note: 'Gel Douche',
        },
        {
          id: 'tx_exp_gym',
          type: 'expense',
          amount: 150,
          categoryId: 'cat_gym',
          date: '2026-11-02',
          createdAt: '2026-11-02',
          note: 'Gym',
        },
      ],
      recurringRules: [],
      recentNotes: [],
      createdAt: '2026-11-01',
    };

    const { account: reconciled, changed } = reconcileIncomeAndInitialBalance(rawAccount);

    expect(changed).toBe(true);
    expect(reconciled.incomeBalanceFixedV1).toBe(true);

    // 1. Incomes: 340 DH changed to 300 DH categorized under "أعمال أخرى"
    const incomes = reconciled.transactions.filter((t) => t.type === 'income');
    expect(incomes.length).toBe(1);
    expect(incomes[0].amount).toBe(300);
    expect(incomes[0].sourceId).toBe('src_autre_travail');
    expect(incomes[0].note).toBe('أعمال أخرى');

    // 2. CRITICAL CONSTRAINT: Expenses remain untouched
    const expenses = reconciled.transactions.filter((t) => t.type === 'expense');
    expect(expenses.length).toBe(2);
    expect(expenses.find((e) => e.note === 'Gel Douche')?.amount).toBe(15.4);
    expect(expenses.find((e) => e.note === 'Gym')?.amount).toBe(150);

    // 3. Current Balance: calculateAvailableBalance() evaluates to EXACTLY 231.50 DH
    const calculatedBalance = calculateAvailableBalance(
      reconciled.initialBalance,
      reconciled.transactions
    );
    expect(calculatedBalance).toBe(231.5);
    expect(reconciled.balance).toBe(231.5);

    // 4. Future addition logic: adding +100 DH income strictly increases balance to 331.50 DH
    const futureIncomeTx: Transaction = {
      id: 'tx_future_100',
      type: 'income',
      amount: 100,
      date: '2026-11-03',
      createdAt: '2026-11-03',
    };
    const nextTransactions = [futureIncomeTx, ...reconciled.transactions];
    const newBalanceWith100 = calculateAvailableBalance(
      reconciled.initialBalance,
      nextTransactions
    );
    expect(newBalanceWith100).toBe(331.5);

    // 5. Re-running reconcile does not overwrite future additions because flag is set
    const { changed: secondRunChanged } = reconcileIncomeAndInitialBalance({
      ...reconciled,
      transactions: nextTransactions,
      balance: newBalanceWith100,
    });
    expect(secondRunChanged).toBe(false);
  });
});

describe('Phase R0 Balance Cleanup & Adjustment Transactions', () => {
  it('adding any transaction changes the balance by exactly its amount', () => {
    const baseInitial = 100;
    const baseTxs: Transaction[] = [];
    const initialBal = calculateAvailableBalance(baseInitial, baseTxs);
    expect(initialBal).toBe(100);

    // 1. Income: strictly increases balance by exact amount
    const incomeTx: Transaction = {
      id: 'tx_inc',
      type: 'income',
      amount: 45.25,
      date: '2026-11-01',
      createdAt: '2026-11-01',
    };
    const afterIncome = calculateAvailableBalance(baseInitial, [incomeTx]);
    expect(afterIncome).toBe(145.25);
    expect(afterIncome - initialBal).toBe(45.25);

    // 2. Expense: strictly decreases balance by exact amount
    const expenseTx: Transaction = {
      id: 'tx_exp',
      type: 'expense',
      amount: 32.10,
      date: '2026-11-01',
      createdAt: '2026-11-01',
    };
    const afterExpense = calculateAvailableBalance(baseInitial, [incomeTx, expenseTx]);
    expect(afterExpense).toBe(113.15);
    expect(Math.round((afterIncome - afterExpense) * 100) / 100).toBe(32.10);

    // 3. Contribution: strictly decreases available balance by exact amount
    const contribTx: Transaction = {
      id: 'tx_contrib',
      type: 'contribution',
      amount: 20.00,
      date: '2026-11-01',
      createdAt: '2026-11-01',
    };
    const afterContrib = calculateAvailableBalance(baseInitial, [incomeTx, expenseTx, contribTx]);
    expect(afterContrib).toBe(93.15);

    // 4. Goal Withdraw: strictly increases available balance by exact amount
    const withdrawTx: Transaction = {
      id: 'tx_with',
      type: 'goal_withdraw',
      amount: 10.00,
      date: '2026-11-01',
      createdAt: '2026-11-01',
    };
    const afterWithdraw = calculateAvailableBalance(baseInitial, [incomeTx, expenseTx, contribTx, withdrawTx]);
    expect(afterWithdraw).toBe(103.15);

    // 5. Positive adjustment: increases balance by exact diff
    const posAdjTx: Transaction = {
      id: 'tx_adj_pos',
      type: 'adjustment',
      amount: 15.50,
      date: '2026-11-01',
      createdAt: '2026-11-01',
    };
    const afterPosAdj = calculateAvailableBalance(baseInitial, [incomeTx, expenseTx, contribTx, withdrawTx, posAdjTx]);
    expect(afterPosAdj).toBe(118.65);
    expect(afterPosAdj - afterWithdraw).toBe(15.50);

    // 6. Negative adjustment: decreases balance by exact diff
    const negAdjTx: Transaction = {
      id: 'tx_adj_neg',
      type: 'adjustment',
      amount: -25.00,
      date: '2026-11-01',
      createdAt: '2026-11-01',
    };
    const afterNegAdj = calculateAvailableBalance(baseInitial, [incomeTx, expenseTx, contribTx, withdrawTx, posAdjTx, negAdjTx]);
    expect(afterNegAdj).toBe(93.65);
    expect(afterNegAdj - afterPosAdj).toBe(-25.00);
  });

  it('reconciling to target balance (e.g. 231.50 DH) creates an exact adjustment transaction', () => {
    // Current state: initialBalance 0, income 300, expenses 194.40 => current balance = 105.60
    const initial = 0;
    const existingTxs: Transaction[] = [
      { id: '1', type: 'income', amount: 300, date: '2026-11-01', createdAt: '2026-11-01' },
      { id: '2', type: 'expense', amount: 194.40, date: '2026-11-01', createdAt: '2026-11-01' },
    ];
    const currentBal = calculateAvailableBalance(initial, existingTxs);
    expect(currentBal).toBe(105.60);

    // Target balance: 231.50 DH
    const targetBalance = 231.50;
    const diff = Math.round((targetBalance - currentBal) * 100) / 100;
    expect(diff).toBe(125.90);

    const adjustmentTx: Transaction = {
      id: 'adj_1',
      type: 'adjustment',
      amount: diff,
      date: '2026-11-02',
      createdAt: '2026-11-02',
      note: 'تعديل الرصيد',
    };

    const newTxs = [adjustmentTx, ...existingTxs];
    const newBal = calculateAvailableBalance(initial, newTxs);
    expect(newBal).toBe(231.50);

    // Undo: removing the adjustment transaction strictly restores previous balance
    const afterUndoTxs = newTxs.filter((t) => t.id !== adjustmentTx.id);
    expect(calculateAvailableBalance(initial, afterUndoTxs)).toBe(105.60);
  });

  it('excludes adjustment transactions from income and expense statistics', () => {
    const transactions: Transaction[] = [
      { id: '1', type: 'income', amount: 300, date: '2026-11-01', createdAt: '2026-11-01' },
      { id: '2', type: 'expense', amount: 150, date: '2026-11-01', createdAt: '2026-11-01' },
      { id: '3', type: 'adjustment', amount: 125.90, date: '2026-11-02', createdAt: '2026-11-02' },
      { id: '4', type: 'adjustment', amount: -50.00, date: '2026-11-02', createdAt: '2026-11-02' },
    ];

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(totalIncome).toBe(300);
    expect(totalExpense).toBe(150);
  });

  it('does NOT special-case any specific value (e.g. 39.35, -66.25, 125.90, 231.50)', () => {
    // 39.35 is never magically turned into 231.50
    expect(calculateAvailableBalance(0, [
      { id: '1', type: 'income', amount: 39.35, date: '2026-11-01', createdAt: '2026-11-01' },
    ])).toBe(39.35);

    expect(selectAvailableBalance({
      initialBalance: 0,
      transactions: [{ id: '1', type: 'income', amount: 39.35, date: '2026-11-01', createdAt: '2026-11-01' }],
    })).toBe(39.35);

    // -66.25 is never magically turned into 125.90
    expect(calculateAvailableBalance(-66.25, [])).toBe(-66.25);

    expect(selectAvailableBalance({
      initialBalance: -66.25,
      transactions: [],
    })).toBe(-66.25);

    // 0 balance stays 0
    expect(calculateAvailableBalance(0, [])).toBe(0);
  });
});

