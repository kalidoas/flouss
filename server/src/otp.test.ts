/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  generateOtpRecord,
  verifyOtpSubmission,
  computeOtpHmac,
  DEFAULT_OTP_EXPIRY_MS,
  MAX_OTP_ATTEMPTS,
} from './otp.js';

describe('OTP Security & Hardening', () => {
  const secret = 'super_secret_test_key_server_env_only';

  it('uses HMAC-SHA256 with server-side secret and per-code salt', () => {
    const code = '123456';
    const salt1 = 'salt_abc';
    const salt2 = 'salt_xyz';

    const hmac1 = computeOtpHmac(code, salt1, secret);
    const hmac2 = computeOtpHmac(code, salt2, secret);
    const hmacDifferentSecret = computeOtpHmac(code, salt1, 'different_secret');

    // Salt ensures different outputs for same code
    expect(hmac1).not.toBe(hmac2);
    // Secret ensures server-side authentication
    expect(hmac1).not.toBe(hmacDifferentSecret);

    // Matches standard HMAC-SHA256 length (64 hex characters)
    expect(hmac1).toHaveLength(64);
  });

  it('verifies a valid code within the 10-minute expiry window and signals deletion after success', () => {
    const now = 1000000;
    const record = generateOtpRecord(now, secret);

    expect(record.code).toMatch(/^\d{6}$/);
    expect(record.expiresAt).toBe(now + 10 * 60 * 1000);
    expect(record.attemptsLeft).toBe(MAX_OTP_ATTEMPTS);

    // 9 minutes later (still valid)
    const verification = verifyOtpSubmission({
      code: record.code,
      storedHash: record.hash,
      salt: record.salt,
      expiresAt: record.expiresAt,
      attemptsLeft: record.attemptsLeft,
      now: now + 9 * 60 * 1000,
      secret,
    });

    expect(verification.success).toBe(true);
    // Code must be deleted immediately after success
    expect(verification.shouldDelete).toBe(true);
  });

  it('enforces 10-minute expiry: rejects and signals deletion once expired', () => {
    const now = 1000000;
    const record = generateOtpRecord(now, secret);

    // 10 minutes and 1 second later (expired)
    const verification = verifyOtpSubmission({
      code: record.code,
      storedHash: record.hash,
      salt: record.salt,
      expiresAt: record.expiresAt,
      attemptsLeft: record.attemptsLeft,
      now: now + 10 * 60 * 1000 + 1000,
      secret,
    });

    expect(verification.success).toBe(false);
    expect(verification.expired).toBe(true);
    expect(verification.shouldDelete).toBe(true);
    expect(verification.error).toContain('expired');
  });

  it('rejects wrong code and decrements remaining attempts', () => {
    const now = 1000000;
    const record = generateOtpRecord(now, secret);
    const wrongCode = record.code === '111111' ? '222222' : '111111';

    const verification = verifyOtpSubmission({
      code: wrongCode,
      storedHash: record.hash,
      salt: record.salt,
      expiresAt: record.expiresAt,
      attemptsLeft: 5,
      now,
      secret,
    });

    expect(verification.success).toBe(false);
    expect(verification.attemptsLeft).toBe(4);
    expect(verification.shouldDelete).toBe(false);
    expect(verification.error).toContain('4 attempts remaining');
  });

  it('invalidates and deletes code after 5 wrong attempts', () => {
    const now = 1000000;
    const record = generateOtpRecord(now, secret);
    const wrongCode = '999999';

    let currentAttempts = 5;

    // Attempts 1 to 4: decrements attempts
    for (let i = 1; i <= 4; i++) {
      const res = verifyOtpSubmission({
        code: wrongCode,
        storedHash: record.hash,
        salt: record.salt,
        expiresAt: record.expiresAt,
        attemptsLeft: currentAttempts,
        now,
        secret,
      });
      expect(res.success).toBe(false);
      expect(res.attemptsLeft).toBe(5 - i);
      expect(res.shouldDelete).toBe(false);
      currentAttempts = res.attemptsLeft!;
    }

    // 5th attempt: must invalidate and signal deletion
    const finalAttempt = verifyOtpSubmission({
      code: wrongCode,
      storedHash: record.hash,
      salt: record.salt,
      expiresAt: record.expiresAt,
      attemptsLeft: 1,
      now,
      secret,
    });

    expect(finalAttempt.success).toBe(false);
    expect(finalAttempt.attemptsLeft).toBe(0);
    expect(finalAttempt.shouldDelete).toBe(true);
    expect(finalAttempt.error).toContain('Maximum attempts reached');

    // Any subsequent attempt with 0 attempts left is blocked and deleted
    const blockedAttempt = verifyOtpSubmission({
      code: record.code, // even with the correct code!
      storedHash: record.hash,
      salt: record.salt,
      expiresAt: record.expiresAt,
      attemptsLeft: 0,
      now,
      secret,
    });
    expect(blockedAttempt.success).toBe(false);
    expect(blockedAttempt.shouldDelete).toBe(true);
  });

  it('validates 6-digit format without penalizing attempt count on formatting errors', () => {
    const now = 1000000;
    const record = generateOtpRecord(now, secret);

    const res = verifyOtpSubmission({
      code: 'abc',
      storedHash: record.hash,
      salt: record.salt,
      expiresAt: record.expiresAt,
      attemptsLeft: 5,
      now,
      secret,
    });

    expect(res.success).toBe(false);
    expect(res.attemptsLeft).toBe(5);
    expect(res.shouldDelete).toBe(false);
    expect(res.error).toContain('6-digit');
  });
});
