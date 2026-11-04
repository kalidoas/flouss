import { describe, it, expect } from 'vitest';
import {
  formatCycleDate,
  calculateNextDueDate,
  initializePaymentsFromPaidMonths,
  getSubscriptionStatus,
  migrateSubscription,
  migrateSubscriptions,
} from './subscriptions';
import { SubscriptionItem } from '../types';

describe('Subscriptions Data Model & Utilities (Phase 1)', () => {
  describe('formatCycleDate', () => {
    it('formats valid cycle dates with padding', () => {
      expect(formatCycleDate(2026, 5, 5)).toBe('2026-05-05');
      expect(formatCycleDate(2026, 11, 15)).toBe('2026-11-15');
    });

    it('clamps day to 30 for 30-day months when billingDay is 31', () => {
      expect(formatCycleDate(2026, 4, 31)).toBe('2026-04-30');
      expect(formatCycleDate(2026, 11, 31)).toBe('2026-11-30');
    });

    it('clamps day to 28 for February in non-leap years', () => {
      expect(formatCycleDate(2026, 2, 31)).toBe('2026-02-28');
    });

    it('clamps day to 29 for February in leap years', () => {
      expect(formatCycleDate(2028, 2, 31)).toBe('2028-02-29');
    });
  });

  describe('calculateNextDueDate', () => {
    const fixedToday = new Date('2026-11-04T12:00:00Z');

    it('finds current cycle date when paidMonths is empty', () => {
      const sub = { billingDay: 5, paidMonths: [] };
      const nextDue = calculateNextDueDate(sub, fixedToday);
      expect(nextDue).toBe('2026-11-05');
    });

    it('starts from current cycle even if past months are not in paidMonths', () => {
      // Legacy sub that only paid October 2026:
      const sub = { billingDay: 10, paidMonths: ['2026-10'] };
      const nextDue = calculateNextDueDate(sub, fixedToday);
      expect(nextDue).toBe('2026-11-10');
    });

    it('advances to next cycle when current cycle is already in paidMonths', () => {
      const sub = { billingDay: 5, paidMonths: ['2026-11'] };
      const nextDue = calculateNextDueDate(sub, fixedToday);
      expect(nextDue).toBe('2026-12-05');
    });

    it('advances past multiple prepaid months', () => {
      const sub = { billingDay: 15, paidMonths: ['2026-11', '2026-12', '2027-01'] };
      const nextDue = calculateNextDueDate(sub, fixedToday);
      expect(nextDue).toBe('2027-02-15');
    });

    it('wraps from December to January of next year', () => {
      const decToday = new Date('2026-12-10T12:00:00Z');
      const sub = { billingDay: 1, paidMonths: ['2026-12'] };
      const nextDue = calculateNextDueDate(sub, decToday);
      expect(nextDue).toBe('2027-01-01');
    });
  });

  describe('initializePaymentsFromPaidMonths', () => {
    it('returns empty array when paidMonths is empty', () => {
      expect(initializePaymentsFromPaidMonths([], 249, 5)).toEqual([]);
    });

    it('converts YYYY-MM items into payments array with amount and cycleDate', () => {
      const paidMonths = ['2026-09', '2026-10'];
      const payments = initializePaymentsFromPaidMonths(paidMonths, 250, 5);

      expect(payments).toEqual([
        { cycleDate: '2026-09-05', paidOn: '2026-09-05', amount: 250 },
        { cycleDate: '2026-10-05', paidOn: '2026-10-05', amount: 250 },
      ]);
    });
  });

  describe('getSubscriptionStatus', () => {
    const today = new Date('2026-11-04T10:00:00Z');

    it('returns "overdue" when nextDueDate is before today and unpaid', () => {
      const sub: SubscriptionItem = {
        id: 'sub_1',
        name: 'Internet',
        amount: 200,
        billingDay: 1,
        category: 'Bills',
        paidMonths: [],
        nextDueDate: '2026-11-01',
        createdAt: '2026-10-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('overdue');
    });

    it('returns "due-today" when nextDueDate is today', () => {
      const sub: SubscriptionItem = {
        id: 'sub_2',
        name: 'Gym',
        amount: 300,
        billingDay: 4,
        category: 'Sport',
        paidMonths: [],
        nextDueDate: '2026-11-04',
        createdAt: '2026-10-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('due-today');
    });

    it('returns "due-soon" when nextDueDate is within default 1-day threshold', () => {
      const sub: SubscriptionItem = {
        id: 'sub_3',
        name: 'Phone',
        amount: 100,
        billingDay: 5,
        category: 'Bills',
        paidMonths: [],
        nextDueDate: '2026-11-05',
        reminderDaysBefore: 1,
        createdAt: '2026-10-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('due-soon');
    });

    it('returns "due-soon" when nextDueDate is within custom reminderDaysBefore threshold', () => {
      const sub: SubscriptionItem = {
        id: 'sub_4',
        name: 'Insurance',
        amount: 500,
        billingDay: 7,
        category: 'Bills',
        paidMonths: [],
        nextDueDate: '2026-11-07',
        reminderDaysBefore: 3,
        createdAt: '2026-10-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('due-soon');
    });

    it('returns "paid-up" when nextDueDate is further than reminderDaysBefore', () => {
      const sub: SubscriptionItem = {
        id: 'sub_5',
        name: 'Cloud Storage',
        amount: 50,
        billingDay: 20,
        category: 'Tech',
        paidMonths: [],
        nextDueDate: '2026-11-20',
        reminderDaysBefore: 1,
        createdAt: '2026-10-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('paid-up');
    });

    it('returns "paid-up" when cycleDate is recorded in payments array', () => {
      const sub: SubscriptionItem = {
        id: 'sub_6',
        name: 'Netflix',
        amount: 100,
        billingDay: 5,
        category: 'Entertainment',
        paidMonths: [],
        nextDueDate: '2026-11-05',
        payments: [{ cycleDate: '2026-11-05', paidOn: '2026-11-03', amount: 100 }],
        createdAt: '2026-10-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('paid-up');
    });

    it('returns "paid-up" when today is past endDate', () => {
      const sub: SubscriptionItem = {
        id: 'sub_7',
        name: 'Trial Subscription',
        amount: 100,
        billingDay: 5,
        category: 'Services',
        paidMonths: [],
        nextDueDate: '2026-11-05',
        endDate: '2026-10-31',
        createdAt: '2026-09-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('paid-up');
    });

    it('returns "paid-up" when nextDueDate exceeds endDate', () => {
      const sub: SubscriptionItem = {
        id: 'sub_7b',
        name: 'Fixed Contract',
        amount: 100,
        billingDay: 5,
        category: 'Services',
        paidMonths: [],
        nextDueDate: '2026-12-05',
        endDate: '2026-11-30',
        createdAt: '2026-09-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('paid-up');
    });

    it('returns "paid-up" when legacy paidMonths contains month of nextDueDate', () => {
      const sub: SubscriptionItem = {
        id: 'sub_8',
        name: 'Gym',
        amount: 300,
        billingDay: 5,
        category: 'Sport',
        paidMonths: ['2026-11'],
        nextDueDate: '2026-11-05',
        createdAt: '2026-09-01',
      };
      expect(getSubscriptionStatus(sub, today)).toBe('paid-up');
    });

    it('calculates status accurately regardless of today time-of-day', () => {
      const startOfDay = new Date('2026-11-04T00:00:01Z');
      const endOfDay = new Date('2026-11-04T23:59:59Z');
      const sub: SubscriptionItem = {
        id: 'sub_9',
        name: 'Spotify',
        amount: 35,
        billingDay: 4,
        category: 'Music',
        paidMonths: [],
        nextDueDate: '2026-11-04',
        createdAt: '2026-09-01',
      };
      expect(getSubscriptionStatus(sub, startOfDay)).toBe('due-today');
      expect(getSubscriptionStatus(sub, endOfDay)).toBe('due-today');
    });

    it('determines status dynamically for legacy sub missing nextDueDate', () => {
      const legacySub: SubscriptionItem = {
        id: 'sub_10',
        name: 'Legacy Telecom',
        amount: 200,
        billingDay: 5,
        category: 'Telecom',
        paidMonths: [],
        createdAt: '2026-09-01',
      };
      // For today = 2026-11-04, next due date is 2026-11-05 (due tomorrow -> 'due-soon')
      expect(getSubscriptionStatus(legacySub, today)).toBe('due-soon');
    });
  });

  describe('migrateSubscription & migrateSubscriptions', () => {
    const today = new Date('2026-11-04T12:00:00Z');

    it('migrates legacy subscription without nextDueDate or payments', () => {
      const legacySub: SubscriptionItem = {
        id: 'sub_legacy',
        name: 'Fiber',
        amount: 249,
        billingDay: 5,
        category: 'Telecom',
        paidMonths: ['2026-10'],
        createdAt: '2026-10-01',
      };

      const migrated = migrateSubscription(legacySub, today);

      // Preserves legacy fields
      expect(migrated.billingDay).toBe(5);
      expect(migrated.paidMonths).toEqual(['2026-10']);

      // Adds calculated nextDueDate and initialized payments
      expect(migrated.nextDueDate).toBe('2026-11-05');
      expect(migrated.payments).toEqual([
        { cycleDate: '2026-10-05', paidOn: '2026-10-05', amount: 249 },
      ]);
    });

    it('does not overwrite existing nextDueDate or payments on already migrated subscription', () => {
      const modernSub: SubscriptionItem = {
        id: 'sub_modern',
        name: 'Gym',
        amount: 300,
        billingDay: 1,
        category: 'Sport',
        paidMonths: ['2026-10'],
        nextDueDate: '2026-12-01',
        payments: [{ cycleDate: '2026-11-01', paidOn: '2026-11-01', amount: 300 }],
        createdAt: '2026-10-01',
      };

      const migrated = migrateSubscription(modernSub, today);

      expect(migrated.nextDueDate).toBe('2026-12-01');
      expect(migrated.payments).toEqual([
        { cycleDate: '2026-11-01', paidOn: '2026-11-01', amount: 300 },
      ]);
    });

    it('migrates an array of subscriptions', () => {
      const subs: SubscriptionItem[] = [
        {
          id: 'sub_1',
          name: 'One',
          amount: 50,
          billingDay: 10,
          category: 'A',
          paidMonths: [],
          createdAt: '2026-10-01',
        },
        {
          id: 'sub_2',
          name: 'Two',
          amount: 150,
          billingDay: 15,
          category: 'B',
          paidMonths: ['2026-11'],
          createdAt: '2026-10-01',
        },
      ];

      const migratedList = migrateSubscriptions(subs, today);

      expect(migratedList).toHaveLength(2);
      expect(migratedList[0].nextDueDate).toBe('2026-11-10');
      expect(migratedList[0].payments).toEqual([]);
      expect(migratedList[1].nextDueDate).toBe('2026-12-15');
      expect(migratedList[1].payments).toEqual([
        { cycleDate: '2026-11-15', paidOn: '2026-11-15', amount: 150 },
      ]);
    });

    it('preserves optional endDate during migration', () => {
      const subWithEnd: SubscriptionItem = {
        id: 'sub_end',
        name: 'Gym Contract',
        amount: 300,
        billingDay: 1,
        category: 'Sport',
        paidMonths: [],
        endDate: '2027-01-01',
        createdAt: '2026-10-01',
      };
      const migrated = migrateSubscription(subWithEnd, today);
      expect(migrated.endDate).toBe('2027-01-01');
    });

    it('gracefully handles undefined or non-array inputs to migrateSubscriptions', () => {
      expect(migrateSubscriptions(undefined, today)).toEqual([]);
    });
  });
});
