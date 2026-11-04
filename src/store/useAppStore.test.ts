/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(),
  },
  db: {},
  googleProvider: {},
  isFirebaseConfigured: false,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-doc' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('@firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-doc' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

import { applyRemoteAccount, useAppStore } from './useAppStore';
import { getDoc, setDoc } from '@firebase/firestore';
import { Transaction } from '../types';

describe('useAppStore - Cross-Device Remote Account Hydration', () => {
  const uid = 'test_user_ios_ubuntu';

  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly hydrates from remote Firestore payload and calculates ground truth balance', () => {
    const remoteData = {
      uid,
      initialBalance: 125.9,
      pinCode: '1234',
      isOnboarded: true,
      account: {
        name: 'Khalid',
        email: 'khalid@test.com',
        initialBalance: 125.9,
        transactions: [
          {
            id: 'tx_inc_1',
            type: 'income',
            amount: 300,
            date: '2026-11-01T10:00:00.000Z',
          },
          {
            id: 'tx_exp_1',
            type: 'expense',
            amount: 194.4,
            date: '2026-11-02T10:00:00.000Z',
          },
        ],
      },
    };

    const result = applyRemoteAccount(uid, remoteData);
    expect(result).not.toBeNull();
    if (!result) return;

    const { finalSyncedAccount, remotePin } = result;
    expect(finalSyncedAccount.id).toBe(uid);
    expect(finalSyncedAccount.name).toBe('Khalid');
    expect(finalSyncedAccount.initialBalance).toBe(125.9);
    // 125.90 + 300.00 - 194.40 = 231.50
    expect(finalSyncedAccount.balance).toBeCloseTo(231.5, 2);
    expect(remotePin).toBe('1234');
    expect(finalSyncedAccount.pinEnabled).toBe(true);
    expect(finalSyncedAccount.isOnboarded).toBe(true);

    // Verify localStorage was forcefully overwritten with cloud truth
    const cached = JSON.parse(localStorage.getItem(`flouss_user_${uid}`) || '{}');
    expect(cached.id).toBe(uid);
    expect(cached.balance).toBeCloseTo(231.5, 2);
  });

  it('handles remote payload where transactions are at root level', () => {
    const remoteData = {
      uid,
      initialBalance: 0,
      transactions: [
        {
          id: 'tx_inc_1',
          type: 'income',
          amount: 500,
          date: '2026-11-01T10:00:00.000Z',
        },
        {
          id: 'tx_exp_1',
          type: 'expense',
          amount: 200,
          date: '2026-11-02T10:00:00.000Z',
        },
      ],
    };

    const result = applyRemoteAccount(uid, remoteData);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.finalSyncedAccount.balance).toBe(300);
    expect(result.remotePin).toBeNull();
  });

  it('returns null if data is null or undefined', () => {
    expect(applyRemoteAccount(uid, null)).toBeNull();
    expect(applyRemoteAccount(uid, undefined)).toBeNull();
  });

  it('migrates legacy subscriptions on account hydration', () => {
    const remoteData = {
      uid,
      initialBalance: 100,
      account: {
        name: 'Khalid',
        subscriptions: [
          {
            id: 'sub_test',
            name: 'Orange Fiber',
            amount: 240,
            billingDay: 5,
            category: 'Telecom',
            paidMonths: ['2026-10'],
            createdAt: '2026-10-01',
          },
        ],
      },
    };

    const result = applyRemoteAccount(uid, remoteData);
    expect(result).not.toBeNull();
    const subs = result?.finalSyncedAccount.subscriptions;
    expect(subs).toBeDefined();
    expect(subs).toHaveLength(1);

    const sub = subs![0];
    expect(sub.billingDay).toBe(5);
    expect(sub.paidMonths).toEqual(['2026-10']);
    expect(sub.nextDueDate).toBeDefined();
    expect(sub.nextDueDate).toMatch(/^\d{4}-\d{2}-05$/);
    expect(sub.payments).toEqual([
      { cycleDate: '2026-10-05', paidOn: '2026-10-05', amount: 240 },
    ]);
  });
});

describe('useAppStore - Persistence & Cloud Sync Safety', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('addTransaction persists to localStorage immediately so data is never lost', () => {
    const store = useAppStore.getState();

    const newTx: Transaction = {
      id: 'tx_bus_100',
      type: 'expense',
      amount: 100,
      categoryId: 'cat_transport',
      subCategoryId: 'sub_tramBus',
      note: 'Bus',
      date: '2026-11-04T10:00:00+01:00',
      createdAt: '2026-11-04T10:00:00.000Z',
    };

    store.addTransaction(newTx);

    // Verify in-memory state
    const currentTxs = useAppStore.getState().transactions;
    expect(currentTxs.some((t) => t.id === 'tx_bus_100')).toBe(true);

    // Verify localStorage has it saved immediately
    const rawDefault = localStorage.getItem('flouss_user_default');
    expect(rawDefault).not.toBeNull();
    const saved = JSON.parse(rawDefault!);
    expect(saved.transactions.some((t: any) => t.id === 'tx_bus_100')).toBe(true);
  });

  it('initAuthSession(null) DOES NOT wipe local accounts or transactions', async () => {
    const store = useAppStore.getState();

    const localTx: Transaction = {
      id: 'tx_local_saved',
      type: 'expense',
      amount: 75,
      categoryId: 'cat_nourriture',
      date: '2026-11-04',
      createdAt: '2026-11-04T10:00:00.000Z',
    };
    store.addTransaction(localTx);

    // Call initAuthSession(null) e.g. on unauthenticated state or popup closed
    await store.initAuthSession(null);

    const stateAfter = useAppStore.getState();
    expect(stateAfter.accounts.length).toBeGreaterThan(0);
    expect(stateAfter.transactions.some((t) => t.id === 'tx_local_saved')).toBe(true);
  });

  it('initAuthSession(user) merges local transactions with cloud and LOCAL STATE WINS', async () => {
    const store = useAppStore.getState();

    // 1. User has an expense added today locally
    const todayBusTx: Transaction = {
      id: 'tx_today_bus_100',
      type: 'expense',
      amount: 100,
      categoryId: 'cat_transport',
      note: 'Bus',
      date: '2026-11-04T09:00:00+01:00',
      createdAt: '2026-11-04T09:00:00.000Z',
    };
    store.addTransaction(todayBusTx);

    // 2. Cloud has an older transaction from yesterday
    const cloudOlderTx: Transaction = {
      id: 'tx_yesterday_food_50',
      type: 'expense',
      amount: 50,
      categoryId: 'cat_nourriture',
      date: '2026-11-03T12:00:00+01:00',
      createdAt: '2026-11-03T12:00:00.000Z',
    };

    (getDoc as any).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        account: {
          id: 'test_uid',
          isOnboarded: true,
          initialBalance: 1000,
          transactions: [cloudOlderTx],
        },
      }),
    });

    // 3. Trigger initAuthSession with user
    await store.initAuthSession({ uid: 'test_uid', email: 'user@example.com' });

    const stateAfter = useAppStore.getState();
    // BOTH transactions must be present: today's bus expense must NOT be wiped!
    const txIds = stateAfter.transactions.map((t) => t.id);
    expect(txIds).toContain('tx_today_bus_100');
    expect(txIds).toContain('tx_yesterday_food_50');
  });

  it('local state wins if cloud sync fails or getDoc throws error', async () => {
    const store = useAppStore.getState();

    const safeTx: Transaction = {
      id: 'tx_offline_safe',
      type: 'expense',
      amount: 120,
      categoryId: 'cat_transport',
      date: '2026-11-04',
      createdAt: '2026-11-04T12:00:00.000Z',
    };
    store.addTransaction(safeTx);

    // Simulate getDoc network/auth failure
    (getDoc as any).mockRejectedValueOnce(new Error('Network error / Auth failure'));

    await store.initAuthSession({ uid: 'test_uid', email: 'user@example.com' });

    const state = useAppStore.getState();
    expect(state.transactions.some((t) => t.id === 'tx_offline_safe')).toBe(true);
  });
});
