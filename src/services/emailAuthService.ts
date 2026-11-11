/**
 * Flouss Email Authentication & 6-Digit OTP Dispatch Service
 * Handles cryptographic 6-digit OTP generation, SHA-256 hashing,
 * 10-minute expiry management, and EmailJS REST API dispatch.
 * 
 * ==============================================================================
 * PRODUCTION SETUP INSTRUCTIONS FOR EMAIL DELIVERY (EmailJS):
 * ==============================================================================
 * To send real 6-digit OTP emails directly to users' Gmail / inboxes in production:
 * 1. Create a free account at https://www.emailjs.com/
 * 2. Add an Email Service (e.g., Gmail, SendGrid, or custom SMTP).
 * 3. Create an Email Template containing:
 *    - To Email: {{to_email}}
 *    - Subject: Votre code de vérification Flouss: {{otp_code}}
 *    - Body containing {{otp_code}} (or {{code}}), {{to_name}}, and {{expiry_minutes}}.
 * 4. Add the following environment variables to your `.env` (or Vercel / Netlify dashboard):
 *    VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
 *    VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
 *    VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
 * ==============================================================================
 */

export interface OtpSessionData {
  hash: string;
  expiresAt: number;
  email: string;
  fullName?: string;
  password?: string;
  mode: 'signup' | 'login';
  devCode?: string; // Stored in dev mode / fallback when EmailJS is unconfigured
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
  // Fallback for non-browser environments
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
  // Simple deterministic fallback hash if SubtleCrypto unavailable
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
 * Also preserves devCode in dev environments for instant friction-free testing.
 */
export const storePendingOtpSession = async (
  email: string,
  code: string,
  meta: { fullName?: string; password?: string; mode: 'signup' | 'login' }
): Promise<void> => {
  if (typeof window === 'undefined') return;
  const hash = await hashOtp(code, email);
  const isEmailConfigured = Boolean(
    import.meta.env.VITE_EMAILJS_SERVICE_ID &&
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID &&
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );

  const session: OtpSessionData = {
    hash,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    email: email.trim().toLowerCase(),
    fullName: meta.fullName?.trim(),
    password: meta.password,
    mode: meta.mode,
    devCode: !isEmailConfigured || import.meta.env.DEV ? code : undefined,
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
 * Verify code against the stored session
 */
export const verifyPendingOtpSession = async (
  code: string,
  email: string
): Promise<{ valid: boolean; reason?: 'expired' | 'invalid' | 'missing'; session?: OtpSessionData }> => {
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

    const testHash = await hashOtp(code, email);
    if (testHash !== session.hash) {
      return { valid: false, reason: 'invalid', session };
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
 * Send real 6-digit OTP code to user's email via EmailJS REST API
 * Includes automatic Fallback Dev Mode logging so developers are never blocked.
 */
export const sendVerificationCodeEmail = async (
  email: string,
  name: string,
  code: string
): Promise<{ success: boolean; error?: string; simulated?: boolean }> => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // 1. Strict Dev Mode OTP Logging for instant developer testing
  console.log('🔐 DEV MODE OTP CODE:', code);
  console.log(
    `%c🔐 [FLOUSS DEV MODE OTP CODE] %c${code} %c(Destination: ${email})`,
    'background: #4f46e5; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
    'background: #10b981; color: #fff; font-weight: bold; font-size: 16px; padding: 4px 8px; border-radius: 4px;',
    'color: #94a3b8; font-style: italic;'
  );

  // 2. Fallback Mechanism: If EmailJS credentials are not configured, simulate delivery with delay
  if (!serviceId || !templateId || !publicKey) {
    console.info(
      'ℹ️ [EmailJS Notice] VITE_EMAILJS_SERVICE_ID is missing in .env. Running in Fallback Dev Mode. Use the OTP code logged above in the console to verify immediately.'
    );

    // Realistic network simulation delay (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, simulated: true };
  }

  // 3. Real EmailJS REST API dispatch when credentials are fully configured
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
      console.warn('[EmailJS Error] API responded with error:', errText);
      return { success: false, error: errText || `EmailJS HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[EmailJS Network Error]:', err);
    return {
      success: false,
      error: err?.message || 'Network error sending verification code email',
    };
  }
};
