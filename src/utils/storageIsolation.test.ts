/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Firebase & Firestore
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(async () => {}),
  },
  db: {},
  googleProvider: {},
  isFirebaseConfigured: false,
}));

vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(async () => {}),
  },
  db: {},
  googleProvider: {},
  isFirebaseConfigured: false,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-doc' })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => null })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  runTransaction: vi.fn(async (_db, fn) =>
    fn({
      get: vi.fn(async () => ({ exists: () => false, data: () => null })),
      set: vi.fn(),
      update: vi.fn(),
    })
  ),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('@firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-doc' })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => null })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  runTransaction: vi.fn(async (_db, fn) =>
    fn({
      get: vi.fn(async () => ({ exists: () => false, data: () => null })),
      set: vi.fn(),
      update: vi.fn(),
    })
  ),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('../services/userProfile', () => ({
  loadUserProfile: vi.fn(async () => null),
  createUserProfile: vi.fn(async (uid: string, overrides: any = {}) => ({
    uid,
    createdAt: new Date().toISOString(),
    emailVerified: false,
    hasPin: false,
    pinHash: null,
    pinSalt: null,
    hasSeenWelcome: false,
    hasSetInitialBalance: false,
    hasBiometricEnrolled: false,
    ...overrides,
  })),
  saveUserPin: vi.fn(async () => true),
  verifyUserPinWithProfile: vi.fn(async () => true),
  updateUserProfileEmailVerified: vi.fn(async () => true),
  updateUserProfileBiometrics: vi.fn(async () => true),
  updateUserProfileWelcome: vi.fn(async () => true),
}));

import {
  saveRollingBackup,
  getRollingBackups,
  savePreSyncSafetyBackup,
  getPreSyncSafetyBackup,
  migrateLegacyBackups,
  purgeUserStorage,
  getRollingBackupsKey,
  getPreSyncBackupKey,
} from './backup';
import {
  setStoredGoogleAccessToken,
  getStoredGoogleAccessToken,
  getCalendarKeys,
} from '../services/googleCalendar';
import { useAppStore } from '../store/useAppStore';

describe('Storage Isolation & Namespacing', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('namespaces rolling backups and safety backups by uid', () => {
    const userA = 'user_aaa_111';
    const userB = 'user_bbb_222';

    const accountA = {
      id: userA,
      name: 'Account A',
      balance: 1000,
      transactions: [{ id: 'tx_a', amount: 50, type: 'expense', category: 'Food', date: '2026-11-15' }],
    };

    const accountB = {
      id: userB,
      name: 'Account B',
      balance: 500,
      transactions: [{ id: 'tx_b', amount: 20, type: 'expense', category: 'Transport', date: '2026-11-15' }],
    };

    saveRollingBackup(accountA, userA);
    saveRollingBackup(accountB, userB);

    savePreSyncSafetyBackup(accountA, userA);
    savePreSyncSafetyBackup(accountB, userB);

    // Verify localStorage keys are namespaced
    expect(localStorage.getItem(getRollingBackupsKey(userA))).not.toBeNull();
    expect(localStorage.getItem(getRollingBackupsKey(userB))).not.toBeNull();
    expect(localStorage.getItem('flouss_rolling_backups')).toBeNull();

    // Verify user A only gets user A backups
    const backupsA = getRollingBackups(userA);
    expect(backupsA).toHaveLength(1);
    expect(backupsA[0].account.id).toBe(userA);

    const backupsB = getRollingBackups(userB);
    expect(backupsB).toHaveLength(1);
    expect(backupsB[0].account.id).toBe(userB);

    // Verify pre-sync safety backup retrieval enforces isolation
    expect(getPreSyncSafetyBackup(userA)?.account?.id).toBe(userA);
    expect(getPreSyncSafetyBackup(userB)?.account?.id).toBe(userB);
  });

  it('migrates un-namespaced legacy backups to uid ONLY if payload matches, then deletes legacy keys', () => {
    const userA = 'uid_alice';
    const legacyRollingPayload = [
      {
        date: '2026-11-01',
        timestamp: '2026-11-01T12:00:00Z',
        transactionCount: 2,
        balance: 200,
        account: { id: userA, name: 'Alice Account' },
      },
      {
        date: '2026-11-01',
        timestamp: '2026-11-01T12:00:00Z',
        transactionCount: 1,
        balance: 50,
        account: { id: 'some_other_uid', name: 'Other Account' },
      },
    ];

    localStorage.setItem('flouss_rolling_backups', JSON.stringify(legacyRollingPayload));
    localStorage.setItem(
      'flouss_pre_sync_safety_backup',
      JSON.stringify({ account: { id: userA, balance: 200 } })
    );
    localStorage.setItem('flouss_google_access_token', 'legacy_token_123');
    localStorage.setItem('flouss_google_calendar_email', 'alice@example.com');

    // Run migration for Alice
    migrateLegacyBackups(userA, 'alice@example.com');

    // Legacy un-namespaced keys must be completely removed
    expect(localStorage.getItem('flouss_rolling_backups')).toBeNull();
    expect(localStorage.getItem('flouss_pre_sync_safety_backup')).toBeNull();
    expect(localStorage.getItem('flouss_google_access_token')).toBeNull();
    expect(localStorage.getItem('flouss_google_calendar_email')).toBeNull();

    // Alice should receive only her entry
    const aliceBackups = getRollingBackups(userA);
    expect(aliceBackups).toHaveLength(1);
    expect(aliceBackups[0].account.id).toBe(userA);

    // Pre-sync backup was migrated
    expect(getPreSyncSafetyBackup(userA)?.account?.id).toBe(userA);

    // Google Calendar was migrated to namespaced key
    const calKeys = getCalendarKeys(userA);
    expect(localStorage.getItem(calKeys.token)).toBe('legacy_token_123');
    expect(localStorage.getItem(calKeys.email)).toBe('alice@example.com');
  });

  it('purges all flouss_* data for a user on logout or account switch', () => {
    const userA = 'uid_alice';
    const calKeysA = getCalendarKeys(userA);

    localStorage.setItem(`flouss_user_${userA}`, JSON.stringify({ id: userA, balance: 100 }));
    localStorage.setItem(getRollingBackupsKey(userA), JSON.stringify([{ account: { id: userA } }]));
    localStorage.setItem(getPreSyncBackupKey(userA), JSON.stringify({ account: { id: userA } }));
    localStorage.setItem(calKeysA.token, 'token_a');
    sessionStorage.setItem(`flouss_2fa_${userA}`, 'verified');

    // Purge user A
    purgeUserStorage(userA);

    // All user A keys must be gone
    expect(localStorage.getItem(`flouss_user_${userA}`)).toBeNull();
    expect(localStorage.getItem(getRollingBackupsKey(userA))).toBeNull();
    expect(localStorage.getItem(getPreSyncBackupKey(userA))).toBeNull();
    expect(localStorage.getItem(calKeysA.token)).toBeNull();
    expect(sessionStorage.getItem(`flouss_2fa_${userA}`)).toBeNull();
  });

  it('prevents cross-user data leakage: sign in as A, create data and backup, log out, sign in as B', async () => {
    const userA = { uid: 'user_A_123', email: 'userA@flouss.app' };
    const userB = { uid: 'user_B_456', email: 'userB@flouss.app' };

    // 1. User A signs in
    await useAppStore.getState().initAuthSession(userA);

    // Create user A data and backup
    const accountA = {
      id: userA.uid,
      name: 'Account A',
      balance: 1500,
      transactions: [
        { id: 'tx_a1', amount: 120, type: 'expense', category: 'Food', date: '2026-11-15' },
      ],
    };
    saveRollingBackup(accountA, userA.uid);
    localStorage.setItem(`flouss_user_${userA.uid}`, JSON.stringify(accountA));
    setStoredGoogleAccessToken('oauth_token_A', true, userA.email, userA.uid);

    expect(getRollingBackups(userA.uid)).toHaveLength(1);
    expect(getStoredGoogleAccessToken(userA.uid)).toBe('oauth_token_A');

    // 2. User A logs out
    await useAppStore.getState().logout();

    // Verify localStorage has no data for User A
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        expect(k).not.toContain(userA.uid);
      }
    }
    expect(localStorage.getItem(`flouss_user_${userA.uid}`)).toBeNull();
    expect(localStorage.getItem(getRollingBackupsKey(userA.uid))).toBeNull();

    // 3. User B signs in
    await useAppStore.getState().initAuthSession(userB);

    // User B must see nothing of User A
    expect(getRollingBackups(userB.uid)).toEqual([]);
    expect(getStoredGoogleAccessToken(userB.uid)).toBeNull();
    expect(useAppStore.getState().transactions).toHaveLength(0);

    // 4. User B cannot restore User A snapshot via importBackup
    const snapshotA = { accounts: [accountA] };
    const restored = await useAppStore.getState().importBackup(JSON.stringify(snapshotA));
    expect(restored).toBe(false);
  });
});
