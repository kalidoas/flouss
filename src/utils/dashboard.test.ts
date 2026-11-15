import { describe, it, expect } from 'vitest';
import { deriveDashboardInsight, hasTwoWeeksOfData } from './dashboard';
import { Transaction, Category } from '../types';

describe('deriveDashboardInsight Safeguards', () => {
  const categories: Category[] = [
    { id: 'food', name: 'Food', icon: 'Utensils', color: '#ff0000', isGoal: false, isArchived: false, createdAt: '2026-01-01' },
    { id: 'transit', name: 'Transit', icon: 'Bus', color: '#00ff00', isGoal: false, isArchived: false, createdAt: '2026-01-01' },
  ];

  it('returns null when transactions.length < 3 (strict data isolation & privacy)', () => {
    const emptyTxs: Transaction[] = [];
    expect(deriveDashboardInsight(emptyTxs, categories)).toBeNull();

    const twoTxs: Transaction[] = [
      { id: '1', amount: 50, type: 'expense', categoryId: 'food', date: '2026-03-01', createdAt: '2026-03-01' },
      { id: '2', amount: 100, type: 'expense', categoryId: 'food', date: '2026-03-02', createdAt: '2026-03-02' },
    ];
    expect(deriveDashboardInsight(twoTxs, categories)).toBeNull();
  });

  it('evaluates hasTwoWeeksOfData correctly', () => {
    const shortSpanTxs: Transaction[] = [
      { id: '1', amount: 50, type: 'expense', categoryId: 'food', date: '2026-03-01', createdAt: '2026-03-01' },
      { id: '2', amount: 100, type: 'expense', categoryId: 'food', date: '2026-03-02', createdAt: '2026-03-02' },
      { id: '3', amount: 150, type: 'expense', categoryId: 'food', date: '2026-03-05', createdAt: '2026-03-05' },
    ];
    expect(hasTwoWeeksOfData(shortSpanTxs)).toBe(false);

    const twoWeekSpanTxs: Transaction[] = [
      { id: '1', amount: 50, type: 'expense', categoryId: 'food', date: '2026-03-01', createdAt: '2026-03-01' },
      { id: '2', amount: 100, type: 'expense', categoryId: 'food', date: '2026-03-08', createdAt: '2026-03-08' },
      { id: '3', amount: 150, type: 'expense', categoryId: 'food', date: '2026-03-16', createdAt: '2026-03-16' },
    ];
    expect(hasTwoWeeksOfData(twoWeekSpanTxs)).toBe(true);
  });

  it('hides weekly comparisons when data span < 14 days', () => {
    const txs: Transaction[] = [
      { id: '1', amount: 50, type: 'expense', categoryId: 'food', date: '2026-03-01', createdAt: '2026-03-01' },
      { id: '2', amount: 100, type: 'expense', categoryId: 'food', date: '2026-03-02', createdAt: '2026-03-02' },
      { id: '3', amount: 150, type: 'expense', categoryId: 'food', date: '2026-03-03', createdAt: '2026-03-03' },
    ];
    const insight = deriveDashboardInsight(txs, categories);
    expect(insight).not.toBeNull();
    // Must NOT be a weekly comparison
    expect(insight?.tag.en).not.toMatch(/Weekly|Compare/i);
    expect(insight?.message.en).not.toMatch(/last week/i);
  });

  it('allows category or summary insight when transactions >= 3 and span < 14 days', () => {
    const txs: Transaction[] = [
      { id: '1', amount: 50, type: 'expense', categoryId: 'food', date: '2026-03-01', createdAt: '2026-03-01' },
      { id: '2', amount: 100, type: 'expense', categoryId: 'food', date: '2026-03-02', createdAt: '2026-03-02' },
      { id: '3', amount: 150, type: 'expense', categoryId: 'food', date: '2026-03-03', createdAt: '2026-03-03' },
    ];
    const insight = deriveDashboardInsight(txs, categories);
    expect(insight).not.toBeNull();
    // Valid non-comparative categories or activity insight
    expect(['Spending distribution', 'Your activity', 'Category', 'Activity', 'Habits']).toContain(insight?.tag.en);
  });
});
