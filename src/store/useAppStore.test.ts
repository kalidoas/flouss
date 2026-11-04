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

import { useAppStore } from './useAppStore';
import { getDoc, setDoc } from 'firebase/firestore';
import { Transaction } from '../types';

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
