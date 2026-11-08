import { describe, expect, it } from 'vitest';
import { selectFinancialSummary } from './calculations';
import { Transaction } from '../types';

const auditTransactions: Transaction[] = [
  { id: 'income', type: 'income', amount: 273.05, date: '2026-11-01', createdAt: '2026-11-01' },
  { id: 'expense-visible', type: 'expense', amount: 324.9, date: '2026-11-02', createdAt: '2026-11-02' },
  { id: 'expense-filtered', type: 'expense', amount: 63.5, date: '2026-11-03', createdAt: '2026-11-03' },
  { id: 'contribution', type: 'contribution', amount: 110.65, date: '2026-11-03', createdAt: '2026-11-03' },
  { id: 'adjustment', type: 'adjustment', amount: 5, date: '2026-11-04', createdAt: '2026-11-04' },
];

describe('selectFinancialSummary', () => {
  it('matches the audited month, history outflow, net, and available balance scopes', () => {
    const monthly = selectFinancialSummary(auditTransactions, { month: '2026-11' });
    const filteredExpenses = selectFinancialSummary(
      auditTransactions.filter((transaction) => transaction.id === 'expense-visible')
    );

    expect(monthly.income).toBe(273.05);
    expect(monthly.expenses).toBe(388.4);
    expect(filteredExpenses.expenses).toBe(324.9);
    expect(monthly.totalOut).toBe(499.05);
    expect(monthly.adjustments).toBe(5);
    expect(monthly.net).toBe(-221);
    expect(350 + monthly.net).toBe(129);
  });

  it('keeps adjustment rows visible while allowing summaries to exclude their effect', () => {
    const summary = selectFinancialSummary(auditTransactions, { includeAdjustments: false });

    expect(summary.adjustments).toBe(5);
    expect(summary.net).toBe(-226);
  });
});
