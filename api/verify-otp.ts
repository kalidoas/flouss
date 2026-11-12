import crypto from 'crypto';
import { getAdminFirestore, getAdminAuth, verifyAuthHeader } from './_firebase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid } = await verifyAuthHeader(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const code = (body?.code || '').toString().trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit verification code.',
      });
    }

    const db = getAdminFirestore();
    const otpRef = db.collection('otp').doc(uid);

    const snap = await otpRef.get();
    if (!snap.exists) {
      return res.status(400).json({
        success: false,
        error: 'No active verification code found. Please request a new code.',
      });
    }

    const data = snap.data()!;
    const now = Date.now();

    // 1. Check expiration (10 min)
    if (now > data.expiresAt) {
      await otpRef.delete().catch(() => {});
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new code.',
      });
    }

    // 2. Check remaining attempts (max 5)
    if (data.attemptsLeft <= 0) {
      await otpRef.delete().catch(() => {});
      return res.status(400).json({
        success: false,
        attemptsLeft: 0,
        error: 'Too many incorrect attempts. Please request a new code.',
      });
    }

    // 3. Constant-time comparison of SHA-256 hash with per-code salt
    const expectedHash = crypto.createHash('sha256').update(data.salt + code).digest('hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const storedBuf = Buffer.from(data.hash, 'hex');

    const isMatch =
      expectedBuf.length === storedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, storedBuf);

    if (!isMatch) {
      const remaining = data.attemptsLeft - 1;
      if (remaining <= 0) {
        await otpRef.delete().catch(() => {});
        return res.status(400).json({
          success: false,
          attemptsLeft: 0,
          error: 'Incorrect code. Maximum attempts reached. Please request a new code.',
        });
      } else {
        await otpRef.update({ attemptsLeft: remaining }).catch(() => {});
        return res.status(400).json({
          success: false,
          attemptsLeft: remaining,
          error: `Incorrect code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
        });
      }
    }

    // 4. Success! Mark emailVerified in Firebase Auth & Profile doc
    const auth = getAdminAuth();
    await auth.updateUser(uid, { emailVerified: true });

    try {
      const profileRef = db.collection('users').doc(uid).collection('meta').doc('profile');
      await profileRef.set({ emailVerified: true }, { merge: true });
    } catch (e) {
      console.warn('[verify-otp] Notice updating profile doc:', e);
    }

    // 5. Delete OTP document immediately so it cannot be reused
    await otpRef.delete().catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (err: any) {
    console.error('[verify-otp] Error:', err);
    return res.status(err?.status || 500).json({
      success: false,
      error: err?.message || 'Internal server error',
    });
  }
}
