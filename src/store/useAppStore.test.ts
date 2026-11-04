/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { applyRemoteAccount } from './useAppStore';

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
});
