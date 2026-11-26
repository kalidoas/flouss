import { describe, expect, it } from 'vitest';
import { calculateFinancialAccountBalances, createPrimaryFinancialAccount, resolveFinancialAccounts } from './financialAccounts';

describe('financial account balances', () => {
  it('uses the legacy total balance as the primary account opening balance', () => {
    expect(resolveFinancialAccounts('u1', 850).map((account) => account.openingBalance)).toEqual([850]);
    expect(createPrimaryFinancialAccount('u1', null).isPrimary).toBe(true);
  });

  it('keeps internal transfers neutral overall and assigns legacy transactions to primary', () => {
    const accounts = [
      { id: 'cash', name: '', type: 'cash' as const, openingBalance: 500, isPrimary: true, createdAt: '' },
      { id: 'bank', name: 'Bank', type: 'bank' as const, openingBalance: 100, createdAt: '' },
    ];
    const transactions = [
      { id: 'old', type: 'expense' as const, amount: 25, date: '2026-01-01', createdAt: '' },
      { id: 'in', type: 'income' as const, amount: 200, accountId: 'bank', date: '2026-01-02', createdAt: '' },
      { id: 'move', type: 'transfer' as const, amount: 50, fromAccountId: 'cash', toAccountId: 'bank', date: '2026-01-03', createdAt: '' },
    ];
    expect(calculateFinancialAccountBalances(accounts, transactions)).toEqual({ cash: 425, bank: 350 });
  });
});
