import crypto from 'crypto';
import { getAdminFirestore, verifyAuthHeader } from './_firebase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid, email } = await verifyAuthHeader(req);
    if (!email) {
      return res.status(400).json({
        error: 'No email address associated with this account.',
      });
    }

    const db = getAdminFirestore();
    const otpRef = db.collection('otp').doc(uid);

    const now = Date.now();
    const snap = await otpRef.get();
    const existing = snap.exists ? snap.data() : null;

    if (existing) {
      // 1. 60-second cooldown between sends
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

    // Generate cryptographically random 6-digit code and random salt
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(salt + otpCode).digest('hex');

    const hourMs = 60 * 60 * 1000;
    const isWithinHour = existing && now - (existing.firstSentThisHour || 0) < hourMs;
    const firstSentThisHour = isWithinHour ? existing.firstSentThisHour : now;
    const sendCountThisHour = isWithinHour ? (existing.sendCountThisHour || 0) + 1 : 1;

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[send-otp] RESEND_API_KEY is missing in environment variables');
      return res.status(500).json({
        error: 'Email service configuration error (missing RESEND_API_KEY).',
      });
    }

    // Clean Obsidian/Zawaq HTML email template
    const emailHtml = `
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
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const resendErr = await resendRes.json().catch(() => ({}));
      console.error('[send-otp] Resend API error:', resendErr);
      return res.status(502).json({
        error: resendErr?.message || 'Failed to dispatch email via Resend.',
      });
    }

    // Persist hash, salt and limits to Firestore `otp/{uid}` (never the raw OTP code!)
    await otpRef.set({
      hash,
      salt,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      attemptsLeft: 5,
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
    console.error('[send-otp] Error:', err);
    return res.status(err?.status || 500).json({
      error: err?.message || 'Internal server error',
    });
  }
}
