import { describe, expect, it } from 'vitest';
import { Category, FocusTask, Transaction } from '../types';
import {
  deriveFrequentExpenseCombos,
  getDailyRateInsight,
  getNetPresentation,
  getOpenFocusTasks,
  deriveDashboardInsight,
  hasTwoWeeksOfData,
} from './dashboard';

describe('dashboard selectors', () => {
  it('calculates the daily allowance from the current balance and days left, including today', () => {
    expect(getDailyRateInsight(100, '2026-11', new Date(2026, 10, 8))).toEqual({ amountPerDay: 4.35, daysLeft: 23 });
    expect(getDailyRateInsight(100, '2026-10', new Date(2026, 10, 8))).toBeNull();
    expect(getDailyRateInsight(0, '2026-11', new Date(2026, 10, 8))).toBeNull();
  });

  it('maps net sign to positive, negative, and neutral presentation states', () => {
    expect(getNetPresentation(0.01)).toEqual({ tone: 'positive', caption: 'netSavedCaption' });
    expect(getNetPresentation(-0.01)).toEqual({ tone: 'negative', caption: 'netSpentCaption' });
    expect(getNetPresentation(0)).toEqual({ tone: 'neutral', caption: 'netEvenCaption' });
  });

  it('hides completed focus tasks and orders overdue before urgent, then by due date', () => {
    const task = (id: string, priority: FocusTask['priority'], dueDate?: string, completed = false): FocusTask => ({
      id, text: id, priority, dueDate, completed, isPinned: false, createdAt: `2026-11-01T00:00:${id.length}Z`,
    });
    const tasks = [
      task('normal', 'normal', '2026-11-09'),
      task('urgent', 'urgent', '2026-11-09'),
      task('overdue-normal', 'normal', '2026-11-07'),
      task('overdue-urgent', 'urgent', '2026-11-06'),
      task('completed', 'urgent', '2026-11-05', true),
    ];
    expect(getOpenFocusTasks(tasks, new Date(2026, 10, 8)).map(({ id }) => id)).toEqual([
      'overdue-urgent', 'overdue-normal', 'urgent', 'normal',
    ]);
    expect(getOpenFocusTasks([], new Date(2026, 10, 8))).toEqual([]);
  });

  it('derives the top three category and amount combos from the last 60 days', () => {
    const categories = ['food', 'cafe', 'old', 'goal'].map((id) => ({
      id, name: id, icon: 'Coffee', color: '#000', isDefault: false, createdAt: '2026-01-01',
      ...(id === 'old' ? { isArchived: true } : {}), ...(id === 'goal' ? { isGoal: true } : {}),
    })) as Category[];
    const tx = (id: string, categoryId: string, amount: number, date: string): Transaction => ({
      id, type: 'expense', categoryId, amount, date, createdAt: date,
    });
    const transactions = [
      tx('1', 'food', 20, '2026-11-01'), tx('2', 'food', 20, '2026-10-30'),
      tx('3', 'cafe', 12, '2026-11-02'), tx('4', 'cafe', 12, '2026-11-03'),
      tx('5', 'cafe', 12, '2026-11-04'), tx('6', 'food', 25, '2026-10-20'),
      tx('7', 'old', 5, '2026-11-02'), tx('8', 'goal', 8, '2026-11-02'),
      tx('9', 'food', 20, '2026-09-01'),
    ];
    expect(deriveFrequentExpenseCombos(transactions, categories, new Date(2026, 10, 8))).toEqual([
      { categoryId: 'cafe', amount: 12, count: 3, latestDate: '2026-11-04' },
      { categoryId: 'food', amount: 20, count: 2, latestDate: '2026-11-01' },
      { categoryId: 'food', amount: 25, count: 1, latestDate: '2026-10-20' },
    ]);
  });

  describe('deriveDashboardInsight & data thresholds', () => {
    const categories: Category[] = [
      { id: 'food', name: 'Food', icon: 'Utensils', color: '#ff0000', isDefault: true, createdAt: '2026-01-01' },
      { id: 'transport', name: 'Transport', icon: 'Car', color: '#00ff00', isDefault: true, createdAt: '2026-01-01' },
    ];

    it('hides every AI/insight card when transactions.length < 3', () => {
      expect(deriveDashboardInsight([], categories)).toBeNull();

      const oneTx: Transaction[] = [
        { id: '1', type: 'expense', categoryId: 'food', amount: 50, date: '2026-11-10', createdAt: '2026-11-10' },
      ];
      expect(deriveDashboardInsight(oneTx, categories)).toBeNull();

      const twoTxs: Transaction[] = [
        { id: '1', type: 'expense', categoryId: 'food', amount: 50, date: '2026-11-10', createdAt: '2026-11-10' },
        { id: '2', type: 'expense', categoryId: 'transport', amount: 30, date: '2026-11-11', createdAt: '2026-11-11' },
      ];
      expect(deriveDashboardInsight(twoTxs, categories)).toBeNull();
    });

    it('suppresses weekly comparison when there is less than 2 weeks of data (span < 14 days)', () => {
      // 3 transactions but spanning only 3 days (e.g. Nov 10 to Nov 13)
      const shortSpanTxs: Transaction[] = [
        { id: '1', type: 'expense', categoryId: 'food', amount: 50, date: '2026-11-10', createdAt: '2026-11-10' },
        { id: '2', type: 'expense', categoryId: 'food', amount: 30, date: '2026-11-11', createdAt: '2026-11-11' },
        { id: '3', type: 'expense', categoryId: 'transport', amount: 20, date: '2026-11-13', createdAt: '2026-11-13' },
      ];

      expect(hasTwoWeeksOfData(shortSpanTxs)).toBe(false);

      const insight = deriveDashboardInsight(shortSpanTxs, categories, new Date(2026, 10, 15));
      expect(insight).not.toBeNull();
      // Must NOT be a weekly comparison
      expect(insight?.type).not.toBe('weekly_comparison');
      // Must be a non-comparative insight like category_share
      expect(insight?.type).toBe('category_share');
      expect(insight?.message.en).toContain('Food represents 80%');
    });

    it('enables weekly comparison only when there is at least 2 weeks of data (span >= 14 days)', () => {
      // Transactions spanning from Oct 28 to Nov 15 (> 14 days)
      // Reference date: Sunday Nov 15, 2026
      // Current week: Mon Nov 9 - Sun Nov 15
      // Previous week: Mon Nov 2 - Sun Nov 8
      const longSpanTxs: Transaction[] = [
        { id: '1', type: 'expense', categoryId: 'food', amount: 100, date: '2026-10-28', createdAt: '2026-10-28' },
        { id: '2', type: 'expense', categoryId: 'food', amount: 100, date: '2026-11-04', createdAt: '2026-11-04' }, // prev week: 100
        { id: '3', type: 'expense', categoryId: 'food', amount: 150, date: '2026-11-12', createdAt: '2026-11-12' }, // curr week: 150
      ];

      expect(hasTwoWeeksOfData(longSpanTxs)).toBe(true);

      const insight = deriveDashboardInsight(longSpanTxs, categories, new Date(2026, 10, 15));
      expect(insight).not.toBeNull();
      expect(insight?.type).toBe('weekly_comparison');
      expect(insight?.message.en).toContain('+50%');
    });
  });
});
