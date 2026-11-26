import { describe, expect, it } from 'vitest';
import { getWeeklySpendComparison } from './weeklyReview';
import { Transaction } from '../types';

describe('getWeeklySpendComparison', () => {
  it('compares the latest seven days with the prior seven and ignores other types', () => {
    const txs = [
      { id: '1', type: 'expense', amount: 30, date: '2026-11-26', createdAt: '2026-11-26' },
      { id: '2', type: 'expense', amount: 20, date: '2026-11-20', createdAt: '2026-11-20' },
      { id: '3', type: 'expense', amount: 10, date: '2026-11-19', createdAt: '2026-11-19' },
      { id: '4', type: 'income', amount: 500, date: '2026-11-25', createdAt: '2026-11-25' },
    ] as Transaction[];
    expect(getWeeklySpendComparison(txs, new Date(2026, 10, 26))).toEqual({ current: 50, previous: 10, difference: 40 });
  });
});
