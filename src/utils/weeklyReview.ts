import { Transaction } from '../types';

export interface WeeklySpendComparison { current: number; previous: number; difference: number; }

export function getWeeklySpendComparison(transactions: Transaction[], now = new Date()): WeeklySpendComparison {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startCurrent = new Date(today);
  startCurrent.setDate(today.getDate() - 6);
  const startPrevious = new Date(today);
  startPrevious.setDate(today.getDate() - 13);
  const endPrevious = new Date(startCurrent);
  endPrevious.setDate(startCurrent.getDate() - 1);
  const inRange = (value: string, start: Date, end: Date) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return false;
    const date = new Date(year, month - 1, day);
    return date >= start && date <= end;
  };
  const sum = (start: Date, end: Date) => transactions.reduce((total, tx) =>
    tx.type === 'expense' && inRange(tx.date, start, end) ? total + (Number(tx.amount) || 0) : total, 0);
  const current = sum(startCurrent, today);
  const previous = sum(startPrevious, endPrevious);
  return { current, previous, difference: current - previous };
}
