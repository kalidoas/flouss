import crypto from 'crypto';

export const DEFAULT_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_OTP_ATTEMPTS = 5;

export function getOtpSecret(): string {
  return process.env.OTP_SECRET || 'flouss_otp_server_secret_v1_secure';
}

/**
 * Computes HMAC-SHA256 with a server-side secret + per-code salt.
 */
export function computeOtpHmac(code: string, salt: string, secret = getOtpSecret()): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${salt}:${code}`)
    .digest('hex');
}

export interface OtpRecord {
  code: string;
  salt: string;
  hash: string;
  createdAt: number;
  expiresAt: number;
  attemptsLeft: number;
}

/**
 * Generates cryptographically secure 6-digit code, random salt, and HMAC-SHA256 hash.
 */
export function generateOtpRecord(now = Date.now(), secret = getOtpSecret()): OtpRecord {
  const code = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = computeOtpHmac(code, salt, secret);
  return {
    code,
    salt,
    hash,
    createdAt: now,
    expiresAt: now + DEFAULT_OTP_EXPIRY_MS,
    attemptsLeft: MAX_OTP_ATTEMPTS,
  };
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  attemptsLeft?: number;
  expired?: boolean;
  shouldDelete: boolean;
}

/**
 * Validates an OTP submission against stored record:
 * - 10-minute expiry
 * - Attempts counting (max 5 wrong attempts then invalidation)
 * - HMAC-SHA256 with server-side secret + per-code salt
 * - Constant-time comparison
 * - Invalidation/deletion signals
 */
export function verifyOtpSubmission(params: {
  code: string;
  storedHash: string;
  salt: string;
  expiresAt: number;
  attemptsLeft: number;
  now?: number;
  secret?: string;
}): VerifyOtpResult {
  const { code, storedHash, salt, expiresAt, attemptsLeft, now = Date.now(), secret = getOtpSecret() } = params;

  // 1. Format validation
  const cleanCode = (code || '').trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: 'Please enter a valid 6-digit verification code.',
      attemptsLeft,
      shouldDelete: false,
    };
  }

  // 2. Check expiration (10 min)
  if (now > expiresAt) {
    return {
      success: false,
      error: 'Invalid or expired verification code.',
      expired: true,
      shouldDelete: true,
    };
  }

  // 3. Check remaining attempts
  if (attemptsLeft <= 0) {
    return {
      success: false,
      error: 'Too many incorrect attempts. Please request a new code.',
      attemptsLeft: 0,
      shouldDelete: true,
    };
  }

  // 4. Constant-time comparison of HMAC-SHA256
  const expectedHash = computeOtpHmac(cleanCode, salt, secret);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');

  const isMatch =
    expectedBuf.length === storedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, storedBuf);

  if (!isMatch) {
    const remaining = attemptsLeft - 1;
    if (remaining <= 0) {
      return {
        success: false,
        attemptsLeft: 0,
        error: 'Incorrect code. Maximum attempts reached. Please request a new code.',
        shouldDelete: true,
      };
    }
    return {
      success: false,
      attemptsLeft: remaining,
      error: `Incorrect code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
      shouldDelete: false,
    };
  }

  // 5. Success! Verified, code must be deleted immediately after success
  return {
    success: true,
    shouldDelete: true,
  };
}
