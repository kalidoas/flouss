import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin, encryptBackup, decryptBackup } from './crypto';

describe('Flouss Crypto & PIN Security Utilities', () => {
  const testPin = '1234';

  it('hashPin generates consistent 64-character SHA-256 hex string', async () => {
    const hash1 = await hashPin(testPin);
    const hash2 = await hashPin(testPin);
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it('hashPin produces different hashes for different PINs', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('5678');
    expect(hash1).not.toBe(hash2);
  });

  it('verifyPin handles legacy 4-digit plain-text PIN with upgrade flag', async () => {
    const result = await verifyPin('1234', '1234');
    expect(result.isValid).toBe(true);
    expect(result.needsUpgrade).toBe(true);

    const failResult = await verifyPin('9999', '1234');
    expect(failResult.isValid).toBe(false);
    expect(failResult.needsUpgrade).toBe(false);
  });

  it('verifyPin handles modern SHA-256 hashed PIN', async () => {
    const hashed = await hashPin(testPin);
    const result = await verifyPin('1234', hashed);
    expect(result.isValid).toBe(true);
    expect(result.needsUpgrade).toBe(false);

    const failResult = await verifyPin('0000', hashed);
    expect(failResult.isValid).toBe(false);
  });

  it('verifyPin returns valid for null/undefined stored PIN', async () => {
    const result1 = await verifyPin('1234', null);
    expect(result1.isValid).toBe(true);
    const result2 = await verifyPin('1234', undefined);
    expect(result2.isValid).toBe(true);
  });

  it('encryptBackup and decryptBackup perform seamless round-trip AES-GCM encryption', async () => {
    const originalBackup = {
      accounts: [
        {
          id: 'acc_1',
          name: 'Main Account',
          balance: 5400,
          pinCode: 'hashed_pin_test',
        },
      ],
      theme: 'dark',
      language: 'fr',
    };

    const encryptedString = await encryptBackup(originalBackup);
    expect(encryptedString).toContain('"encrypted": true');
    expect(encryptedString).toContain('"algorithm": "AES-GCM-256"');

    const decrypted = await decryptBackup<typeof originalBackup>(encryptedString);
    expect(decrypted).toEqual(originalBackup);
  });

  it('decryptBackup supports legacy unencrypted JSON backup seamlessly', async () => {
    const legacyBackup = {
      accounts: [
        {
          id: 'acc_legacy',
          name: 'Old Account',
          balance: 1000,
        },
      ],
      theme: 'system',
      language: 'ar',
      exportedAt: '2026-01-01T00:00:00.000Z',
    };

    const legacyJsonString = JSON.stringify(legacyBackup);
    const parsed = await decryptBackup<typeof legacyBackup>(legacyJsonString);
    expect(parsed).toEqual(legacyBackup);
  });

  it('decryptBackup returns null on invalid or corrupted data', async () => {
    const corrupted = 'not-valid-json';
    const result = await decryptBackup(corrupted);
    expect(result).toBeNull();
  });
});
