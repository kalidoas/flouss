/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { hashPin, verifyPin, hashPinPBKDF2, verifyPinPBKDF2 } from './crypto';
import { saveRollingBackup, getRollingBackups, savePreSyncSafetyBackup, getPreSyncSafetyBackup, purgeUserStorage } from './backup';

describe('PIN Migration & User Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('old plain-text 4-digit PIN upgrades to PBKDF2 hash on successful verification', async () => {
    const oldPin = '9999';

    const result = await verifyPin(oldPin, oldPin);
    expect(result.isValid).toBe(true);
    expect(result.needsUpgrade).toBe(true);

    const upgradedHash = await hashPin(oldPin);
    const secondResult = await verifyPin(oldPin, upgradedHash);
    expect(secondResult.isValid).toBe(true);
    expect(secondResult.needsUpgrade).toBe(false);
  });

  it('wrong PIN returns invalid and does not upgrade', async () => {
    const correctPin = '1234';
    const storedHash = await hashPin(correctPin);

    const wrongAttempts = ['0000', '2222', '3333', 'wrong', '12345'];
    for (const wrongPin of wrongAttempts) {
      const result = await verifyPin(wrongPin, storedHash);
      expect(result.isValid).toBe(false);
      expect(result.needsUpgrade).toBe(false);
    }
  });

  it('per-user namespacing: two users with same PIN do not collide', async () => {
    const uidA = 'user_aaa_111';
    const uidB = 'user_bbb_222';
    const commonPin = '4444';

    const saltA = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const saltB = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=';

    const hashA = await hashPinPBKDF2(commonPin, saltA);
    const hashB = await hashPinPBKDF2(commonPin, saltB);

    expect(hashA).not.toBe(hashB);

    const resultA = await verifyPinPBKDF2(commonPin, hashA, saltA);
    expect(resultA).toBe(true);

    const resultB = await verifyPinPBKDF2(commonPin, hashB, saltB);
    expect(resultB).toBe(true);

    const crossResult = await verifyPinPBKDF2(commonPin, hashA, saltB);
    expect(crossResult).toBe(false);
  });

  it('logout does not delete another user’s data (per-uid isolation)', async () => {
    const uidA = 'user_aaa_111';
    const uidB = 'user_bbb_222';

    const accountA = {
      id: uidA,
      name: 'Account A',
      balance: 1000,
      transactions: [{ id: 'tx_a', amount: 50, type: 'expense', category: 'Food', date: '2026-11-15' }],
    };

    const accountB = {
      id: uidB,
      name: 'Account B',
      balance: 500,
      transactions: [{ id: 'tx_b', amount: 20, type: 'expense', category: 'Transport', date: '2026-11-15' }],
    };

    saveRollingBackup(accountA, uidA);
    saveRollingBackup(accountB, uidB);
    savePreSyncSafetyBackup(accountA, uidA);
    savePreSyncSafetyBackup(accountB, uidB);

    const backupsA = getRollingBackups(uidA);
    const backupsB = getRollingBackups(uidB);
    expect(backupsA).toHaveLength(1);
    expect(backupsB).toHaveLength(1);
    expect(backupsA[0].account.id).toBe(uidA);
    expect(backupsB[0].account.id).toBe(uidB);

    purgeUserStorage(uidA);

    expect(getRollingBackups(uidA)).toEqual([]);
    expect(getPreSyncSafetyBackup(uidA)).toBeNull();

    const backupsBAfter = getRollingBackups(uidB);
    expect(backupsBAfter).toHaveLength(1);
    expect(backupsBAfter[0].account.id).toBe(uidB);
    expect(getPreSyncSafetyBackup(uidB)?.account?.id).toBe(uidB);
  });
});
