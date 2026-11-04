import { Subscription, SubscriptionItem, SubscriptionPayment, SubscriptionStatus } from '../types';

/**
 * Format a cycle date (YYYY-MM-DD) given a year, a 1-based month, and a target billing day.
 * Safely clamps the day to the maximum number of days in that month (e.g. Feb 28/29, Nov 30).
 */
export function formatCycleDate(year: number, month: number, billingDay: number = 1): string {
  const maxDays = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(Math.max(1, billingDay), maxDays);
  const mm = String(month).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Calculates the nextDueDate string (YYYY-MM-DD) for a subscription.
 * Finds the first cycle (YYYY-MM) NOT in paidMonths starting from the current cycle (based on today),
 * and constructs the YYYY-MM-DD string using the old billingDay.
 */
export function calculateNextDueDate(
  sub: { billingDay?: number; paidMonths?: string[] },
  today: Date = new Date()
): string {
  const billingDay = sub.billingDay ?? 1;
  const paidSet = new Set(sub.paidMonths ?? []);

  let year = today.getFullYear();
  let month = today.getMonth() + 1; // 1 to 12

  // Loop forward until we find a cycle (YYYY-MM) not present in paidMonths.
  // Capped at 120 iterations (10 years) to avoid any runaway loops.
  let iterations = 0;
  while (paidSet.has(`${year}-${String(month).padStart(2, '0')}`) && iterations < 120) {
    if (month === 12) {
      year += 1;
      month = 1;
    } else {
      month += 1;
    }
    iterations++;
  }

  return formatCycleDate(year, month, billingDay);
}

/**
 * Initializes the payments array from legacy paidMonths array.
 * Assumes amount = sub.amount, paidOn = cycleDate.
 */
export function initializePaymentsFromPaidMonths(
  paidMonths: string[] = [],
  amount: number = 0,
  billingDay: number = 1
): SubscriptionPayment[] {
  return paidMonths.map((m) => {
    let cycleDate: string;
    if (m.length === 7 && m.includes('-')) {
      const [y, mon] = m.split('-').map(Number);
      cycleDate = formatCycleDate(y, mon, billingDay);
    } else if (m.length === 10) {
      cycleDate = m;
    } else {
      cycleDate = m;
    }

    return {
      cycleDate,
      paidOn: cycleDate,
      amount,
    };
  });
}

/**
 * Pure utility function to determine the status of a subscription.
 * Returns one of: 'paid-up' | 'due-soon' | 'due-today' | 'overdue'.
 * - 'due-soon' is within the reminderDaysBefore threshold (defaults to 1 day before).
 */
export function getSubscriptionStatus(
  sub: Subscription,
  today: Date = new Date()
): SubscriptionStatus {
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  // 1. If subscription has an endDate and today is strictly past the endDate
  if (sub.endDate) {
    const [endY, endM, endD] = sub.endDate.split('-').map(Number);
    if (!isNaN(endY) && !isNaN(endM) && !isNaN(endD)) {
      const endUtc = Date.UTC(endY, endM - 1, endD);
      if (todayUtc > endUtc) {
        return 'paid-up';
      }
    }
  }

  // 2. Resolve the effective nextDueDate (calculate from legacy fields if missing)
  const nextDueDate = sub.nextDueDate || calculateNextDueDate(sub, today);
  if (!nextDueDate) {
    return 'paid-up';
  }

  // 3. If nextDueDate exceeds endDate, no more payments are due
  if (sub.endDate && nextDueDate > sub.endDate) {
    return 'paid-up';
  }

  // 4. Check if the cycle for nextDueDate has already been paid
  const isCyclePaid =
    Boolean(sub.payments && sub.payments.some((p) => p.cycleDate === nextDueDate)) ||
    Boolean(sub.paidMonths && sub.paidMonths.includes(nextDueDate.slice(0, 7)));

  if (isCyclePaid) {
    return 'paid-up';
  }

  // 5. Compare nextDueDate with today in calendar days
  const [dueY, dueM, dueD] = nextDueDate.split('-').map(Number);
  if (isNaN(dueY) || isNaN(dueM) || isNaN(dueD)) {
    return 'paid-up';
  }

  const dueUtc = Date.UTC(dueY, dueM - 1, dueD);
  const diffDays = Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'overdue';
  }

  if (diffDays === 0) {
    return 'due-today';
  }

  const threshold = sub.reminderDaysBefore ?? 1;
  if (diffDays <= threshold) {
    return 'due-soon';
  }

  return 'paid-up';
}

/**
 * Pure migration function for a single subscription item.
 * Preserves legacy fields (billingDay, paidMonths) and adds nextDueDate and payments if missing.
 */
export function migrateSubscription(
  sub: SubscriptionItem,
  today: Date = new Date()
): SubscriptionItem {
  const nextDueDate = sub.nextDueDate ?? calculateNextDueDate(sub, today);
  const payments =
    sub.payments ??
    initializePaymentsFromPaidMonths(sub.paidMonths ?? [], sub.amount, sub.billingDay ?? 1);

  return {
    ...sub,
    nextDueDate,
    payments,
  };
}

/**
 * Pure migration function for a list of subscription items.
 */
export function migrateSubscriptions(
  subs?: SubscriptionItem[],
  today: Date = new Date()
): SubscriptionItem[] {
  if (!Array.isArray(subs)) return [];
  return subs.map((sub) => migrateSubscription(sub, today));
}
