import { describe, expect, it } from 'vitest';
import { Category, FocusTask, Transaction } from '../types';
import { deriveFrequentExpenseCombos, getDailyRateInsight, getNetPresentation, getOpenFocusTasks } from './dashboard';

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
});
