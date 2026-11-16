import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { getAdminFirestore, getAdminAuth, getFirebaseAdminApp, verifyAuthHeader } from './firebase.js';
import {
  getOtpSecret,
  generateOtpRecord,
  verifyOtpSubmission,
  computeOtpHmac,
} from './otp.js';

export { computeOtpHmac, generateOtpRecord, verifyOtpSubmission };

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Never start a production OTP service with a missing or weak HMAC secret.
if (process.env.NODE_ENV === 'production') {
  try {
    getOtpSecret();
    if (!process.env.ALLOWED_ORIGIN?.trim()) {
      throw new Error('ALLOWED_ORIGIN is required');
    }
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required');
    }
    getFirebaseAdminApp();
  } catch {
    console.error('Startup configuration error: check OTP_SECRET, ALLOWED_ORIGIN, Firebase Admin credentials, and RESEND_API_KEY.');
    process.exit(1);
  }
}

// Coolify's reverse proxy is one hop in front of this container by default.
// Override TRUST_PROXY_HOPS if the deployment topology differs.
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? (process.env.NODE_ENV === 'production' ? 1 : 0));
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) {
  throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5');
}
app.set('trust proxy', trustProxyHops);

// ─── CORS Configuration ────────────────────────────────────────────────────────
const customOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const devOrigins =
  process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
    : [];
const invalidOrigins = customOrigins.filter((value) => {
  try {
    const parsed = new URL(value);
    return parsed.origin !== value || (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:');
  } catch {
    return true;
  }
});
if (invalidOrigins.length > 0) {
  throw new Error('ALLOWED_ORIGIN must contain comma-separated HTTPS origins in production');
}
const allowedOrigins = new Set([...customOrigins, ...devOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or in allowed list
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      const error: any = new Error('Origin not allowed');
      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Security headers for the JSON API (TLS is terminated at Coolify's proxy).
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }
  next();
});

app.use(express.json({ limit: '10kb' }));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // Limit each IP to 120 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use(globalLimiter);

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 send-otp attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests from this IP. Please wait before retrying.' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please wait before retrying.' },
});

// ─── Health Endpoint ───────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── HTML Email Template ───────────────────────────────────────────────────────
function buildEmailTemplate(otpCode: string): string {
  return `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification Flouss</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #0D0E14; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 36px 28px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);">
    <tr>
      <td align="center" style="padding-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(16, 185, 129, 0.2)); border: 1px solid rgba(255, 255, 255, 0.15); font-size: 20px; font-weight: bold; color: #818cf8; text-align: center;">
          ◈
        </div>
        <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; margin-top: 12px;">
          Flouss
        </div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom: 8px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.01em;">
          Vérification de votre adresse email
        </h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">
          Saisissez ce code à 6 chiffres dans l'application pour confirmer votre adresse :
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom: 24px;">
        <div style="display: inline-block; padding: 16px 28px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #c7d2fe; text-align: center;">
          ${otpCode}
        </div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom: 24px;">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #94a3b8;">
          ⏱ Ce code expire dans <strong>10 minutes</strong>
        </div>
      </td>
    </tr>
    <tr>
      <td style="border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px;">
        <p style="margin: 0; font-size: 11px; color: #71717a; text-align: center; line-height: 1.5;">
          Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Ne partagez ce code avec personne.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── POST /api/send-otp Handler ───────────────────────────────────────────────
async function handleSendOtp(req: Request, res: Response) {
  try {
    const { uid, email } = await verifyAuthHeader(req);
    if (!email) {
      // Never reveal whether an account or email exists
      return res.status(200).json({
        success: true,
        message: 'Verification code sent to your email',
        cooldownSeconds: 60,
      });
    }

    const db = getAdminFirestore();
    const otpRef = db.collection('otp').doc(uid);

    const now = Date.now();
    const snap = await otpRef.get();
    const existing = snap.exists ? snap.data() : null;

    if (existing) {
      // 1. 60-second cooldown between consecutive sends
      if (existing.lastSentAt && now - existing.lastSentAt < 60_000) {
        const remainingSec = Math.ceil((60_000 - (now - existing.lastSentAt)) / 1000);
        return res.status(429).json({
          error: `Please wait ${remainingSec} seconds before requesting another code.`,
          retryAfter: remainingSec,
        });
      }

      // 2. Max 5 sends per hour per user
      const hourMs = 60 * 60 * 1000;
      const firstSent = existing.firstSentThisHour || existing.lastSentAt || now;
      const countThisHour = existing.sendCountThisHour || 1;

      if (now - firstSent < hourMs && countThisHour >= 5) {
        const resetMinutes = Math.ceil((hourMs - (now - firstSent)) / 60000);
        return res.status(429).json({
          error: `Hourly limit reached. You can request up to 5 codes per hour. Please try again in ${resetMinutes} minutes.`,
        });
      }
    }

    // Cryptographically random 6-digit code, random salt, and HMAC-SHA256 with server-side secret
    const otpRecord = generateOtpRecord(now);
    const { code: otpCode, salt, hash, expiresAt, attemptsLeft } = otpRecord;

    const hourMs = 60 * 60 * 1000;
    const isWithinHour = existing && now - (existing.firstSentThisHour || 0) < hourMs;
    const firstSentThisHour = isWithinHour ? existing.firstSentThisHour : now;
    const sendCountThisHour = isWithinHour ? (existing.sendCountThisHour || 0) + 1 : 1;

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[send-otp] RESEND_API_KEY is missing in environment variables');
      return res.status(500).json({
        error: 'Email service is temporarily unavailable.',
      });
    }

    const fromSender = process.env.RESEND_FROM || 'Flouss <notifications@flouss.live>';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromSender,
        to: email,
        subject: `Votre code Flouss: ${otpCode}`,
        html: buildEmailTemplate(otpCode),
      }),
    });

    if (!resendRes.ok) {
      console.error(`[send-otp] Resend request failed with status ${resendRes.status}`);
      return res.status(502).json({
        error: 'Email delivery failed. Please try again later.',
      });
    }

    // Persist HMAC hash, salt and limits to Firestore `otp/{uid}` (never the raw OTP code!)
    await otpRef.set({
      hash,
      salt,
      createdAt: now,
      expiresAt,
      attemptsLeft,
      lastSentAt: now,
      firstSentThisHour,
      sendCountThisHour,
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      cooldownSeconds: 60,
    });
  } catch (err: any) {
    console.error(`[send-otp] Request failed (status ${err?.status || 500})`);
    return res.status(err?.status || 500).json({
      error: err?.status === 401 ? 'Authentication required.' : 'Unable to send the verification code right now.',
    });
  }
}

// ─── POST /api/verify-otp Handler ─────────────────────────────────────────────
async function handleVerifyOtp(req: Request, res: Response) {
  try {
    const { uid } = await verifyAuthHeader(req);
    const code = (req.body?.code || '').toString().trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit verification code.',
      });
    }

    const db = getAdminFirestore();
    const otpRef = db.collection('otp').doc(uid);

    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(otpRef);
      if (!snap.exists) return { missing: true as const };

      const data = snap.data()!;
      const verification = verifyOtpSubmission({
        code,
        storedHash: data.hash,
        salt: data.salt,
        expiresAt: data.expiresAt,
        attemptsLeft: data.attemptsLeft,
        now: Date.now(),
      });

      if (verification.shouldDelete) {
        transaction.delete(otpRef);
      } else if (verification.attemptsLeft !== undefined) {
        transaction.update(otpRef, { attemptsLeft: verification.attemptsLeft });
      }
      return { missing: false as const, verification };
    });

    if (result.missing) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code.',
      });
    }

    const verification = result.verification;

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        attemptsLeft: verification.attemptsLeft ?? 0,
        error: verification.error || 'Invalid verification code.',
      });
    }

    // Success! Enforce verification server-side: mark emailVerified in Firebase Auth & Profile doc
    const auth = getAdminAuth();
    await auth.updateUser(uid, { emailVerified: true });

    try {
      const profileRef = db.collection('users').doc(uid).collection('meta').doc('profile');
      await profileRef.set({ emailVerified: true }, { merge: true });
    } catch (e) {
      console.warn('[verify-otp] Notice updating profile doc:', e);
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (err: any) {
    console.error(`[verify-otp] Request failed (status ${err?.status || 500})`);
    return res.status(err?.status || 500).json({
      success: false,
      error: err?.status === 401 ? 'Authentication required.' : 'Unable to verify the code right now.',
    });
  }
}

// ─── Register Routes ───────────────────────────────────────────────────────────
// Support both `/api/*` and direct `/*` prefixes
app.post('/api/send-otp', otpSendLimiter, handleSendOtp);
app.post('/send-otp', otpSendLimiter, handleSendOtp);

app.post('/api/verify-otp', otpVerifyLimiter, handleVerifyOtp);
app.post('/verify-otp', otpVerifyLimiter, handleVerifyOtp);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`Request rejected (status ${err?.status || 500})`);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 403 ? 'Origin not allowed.' : 'Internal server error.',
  });
});

app.listen(port, () => {
  console.log(`🚀 Flouss OTP Service listening on port ${port}`);
  console.log(`Allowed origins: ${Array.from(allowedOrigins).join(', ')}`);
});
