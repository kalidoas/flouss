import { Category, FocusTask, Transaction } from '../types';

export interface DailyRateInsight {
  amountPerDay: number;
  daysLeft: number;
}

export function getDailyRateInsight(balance: number, selectedMonth: string, now = new Date()): DailyRateInsight | null {
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (selectedMonth !== currentMonth || balance <= 0) return null;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  return { amountPerDay: Math.round((balance / daysLeft) * 100) / 100, daysLeft };
}

export function getNetPresentation(net: number): {
  tone: 'positive' | 'negative' | 'neutral';
  caption: 'netSavedCaption' | 'netSpentCaption' | 'netEvenCaption';
} {
  if (net > 0) return { tone: 'positive', caption: 'netSavedCaption' };
  if (net < 0) return { tone: 'negative', caption: 'netSpentCaption' };
  return { tone: 'neutral', caption: 'netEvenCaption' };
}

export function getOpenFocusTasks(focusTasks: FocusTask[] = [], today = new Date()): FocusTask[] {
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return focusTasks
    .filter((task) => !task.completed)
    .slice()
    .sort((a, b) => {
      const aOverdue = Boolean(a.dueDate && a.dueDate < todayKey);
      const bOverdue = Boolean(b.dueDate && b.dueDate < todayKey);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      const aUrgent = a.priority === 'urgent';
      const bUrgent = b.priority === 'urgent';
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export interface FrequentExpenseCombo {
  categoryId: string;
  amount: number;
  count: number;
  latestDate: string;
}

export function deriveFrequentExpenseCombos(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  now = new Date(),
  limit = 3
): FrequentExpenseCombo[] {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setDate(cutoff.getDate() - 59);
  const validCategories = new Set(categories.filter((category) => !category.isArchived && !category.isGoal).map((category) => category.id));
  const combos = new Map<string, FrequentExpenseCombo>();

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense' || !transaction.categoryId || !validCategories.has(transaction.categoryId)) return;
    const dateKey = transaction.date?.slice(0, 10);
    if (!dateKey) return;
    const date = new Date(`${dateKey}T00:00:00`);
    if (!Number.isFinite(date.getTime()) || date < cutoff || date > now) return;
    const cents = Math.round((Number(transaction.amount) || 0) * 100);
    if (cents <= 0) return;
    const key = `${transaction.categoryId}:${cents}`;
    const existing = combos.get(key);
    if (existing) {
      existing.count += 1;
      if (dateKey > existing.latestDate) existing.latestDate = dateKey;
    } else {
      combos.set(key, { categoryId: transaction.categoryId, amount: cents / 100, count: 1, latestDate: dateKey });
    }
  });

  return [...combos.values()]
    .sort((a, b) => b.count - a.count || b.latestDate.localeCompare(a.latestDate) || a.categoryId.localeCompare(b.categoryId) || a.amount - b.amount)
    .slice(0, Math.max(0, limit));
}
