/**
 * Flouss Email Authentication & 6-Digit OTP Dispatch Service
 * Handles cryptographic 6-digit OTP generation, SHA-256 hashing,
 * 10-minute expiry management, max 5 attempts tracking, 60s cooldown,
 * and EmailJS REST API dispatch.
 *
 * OTP codes are sent EXCLUSIVELY by email and NEVER exposed in UI or console logs.
 */

export interface OtpSessionData {
  hash: string;
  expiresAt: number;
  email: string;
  fullName?: string;
  password?: string;
  mode: 'signup' | 'login';
  attempts: number;
  resendCooldownUntil: number;
}

/**
 * Generate a cryptographically secure 6-digit code (100000 - 999999)
 */
export const generateCryptographicOtp = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const code = 100000 + (array[0] % 900000);
    return code.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash the OTP code together with email and a salt using SHA-256
 */
export const hashOtp = async (code: string, email: string): Promise<string> => {
  const normalized = `${code.trim()}:${email.trim().toLowerCase()}:flouss_salt_2026`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

const OTP_STORAGE_KEY = 'flouss_otp_session';

/**
 * Store the OTP hash and 10-minute expiry in sessionStorage.
 * Security: NEVER stores raw code or devCode.
 */
export const storePendingOtpSession = async (
  email: string,
  code: string,
  meta: { fullName?: string; password?: string; mode: 'signup' | 'login' }
): Promise<void> => {
  if (typeof window === 'undefined') return;
  const hash = await hashOtp(code, email);

  const session: OtpSessionData = {
    hash,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    email: email.trim().toLowerCase(),
    fullName: meta.fullName?.trim(),
    password: meta.password,
    mode: meta.mode,
    attempts: 0,
    resendCooldownUntil: Date.now() + 60 * 1000, // 60s cooldown
  };
  window.sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(session));
};

/**
 * Retrieve the active OTP session from sessionStorage
 */
export const getPendingOtpSession = (): OtpSessionData | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(OTP_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Check if the user is currently allowed to request another OTP (60s cooldown)
 */
export const getOtpResendCooldownSeconds = (): number => {
  const session = getPendingOtpSession();
  if (!session || !session.resendCooldownUntil) return 0;
  const diffMs = session.resendCooldownUntil - Date.now();
  return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
};

/**
 * Verify code against the stored session with max 5 attempts limit and 10-minute expiry
 */
export const verifyPendingOtpSession = async (
  code: string,
  email: string
): Promise<{
  valid: boolean;
  reason?: 'expired' | 'invalid' | 'missing' | 'max_attempts_exceeded';
  attemptsRemaining?: number;
  session?: OtpSessionData;
}> => {
  if (typeof window === 'undefined') return { valid: false, reason: 'missing' };
  const raw = window.sessionStorage.getItem(OTP_STORAGE_KEY);
  if (!raw) return { valid: false, reason: 'missing' };

  try {
    const session: OtpSessionData = JSON.parse(raw);
    if (!session || session.email !== email.trim().toLowerCase()) {
      return { valid: false, reason: 'missing' };
    }

    if (Date.now() > session.expiresAt) {
      window.sessionStorage.removeItem(OTP_STORAGE_KEY);
      return { valid: false, reason: 'expired', session };
    }

    if (session.attempts >= 5) {
      window.sessionStorage.removeItem(OTP_STORAGE_KEY);
      return { valid: false, reason: 'max_attempts_exceeded', attemptsRemaining: 0, session };
    }

    const testHash = await hashOtp(code, email);
    if (testHash !== session.hash) {
      session.attempts = (session.attempts || 0) + 1;
      const attemptsRemaining = Math.max(0, 5 - session.attempts);
      if (attemptsRemaining === 0) {
        window.sessionStorage.removeItem(OTP_STORAGE_KEY);
        return { valid: false, reason: 'max_attempts_exceeded', attemptsRemaining: 0, session };
      }
      window.sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(session));
      return { valid: false, reason: 'invalid', attemptsRemaining, session };
    }

    return { valid: true, session };
  } catch {
    return { valid: false, reason: 'missing' };
  }
};

/**
 * Clear the OTP session
 */
export const clearPendingOtpSession = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(OTP_STORAGE_KEY);
};

/**
 * Send 6-digit OTP code to user's email via EmailJS REST API.
 * The code is ONLY sent via email and NEVER logged or printed.
 */
export const sendVerificationCodeEmail = async (
  email: string,
  name: string,
  code: string
): Promise<{ success: boolean; error?: string }> => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      error: 'Email service is not configured (missing VITE_EMAILJS environment variables).',
    };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: email,
          to_name: name || email.split('@')[0],
          otp_code: code,
          verification_code: code,
          passcode: code,
          code: code,
          app_name: 'Flouss',
          expiry_minutes: '10',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: errText || `Email service error: HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while dispatching verification email',
    };
  }
};
