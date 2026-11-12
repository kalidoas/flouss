/**
 * Flouss User Profile Service
 * Manages users/{uid}/meta/profile sub-document in Firestore.
 *
 * The profile doc separates auth-level metadata (PIN, biometric flag, welcome flag,
 * email verification status) from the main account data document.
 *
 * Security guarantee:
 *  - PIN hash is NEVER stored in localStorage. It lives only in Firestore + RAM.
 *  - Salt is a random 32-byte value stored in the profile doc alongside the hash.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { hashPinPBKDF2, verifyPinPBKDF2 } from '../utils/crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfileDoc {
  uid: string;
  createdAt: string;
  emailVerified: boolean;
  hasPin: boolean;
  /** PBKDF2-derived hash, base64url-encoded */
  pinHash: string | null;
  /** Random 32-byte salt, base64url-encoded */
  pinSalt: string | null;
  /** PBKDF2 iterations used (stored so we can increase later and re-hash on login) */
  pinIterations: number;
  /** Failed PIN attempt counter (reset on success, persisted across devices) */
  pinFailCount: number;
  /** Unix-ms timestamp until which PIN entry is locked (0 = not locked) */
  lockedUntil: number;
  /** True after the user has seen and dismissed the Welcome screen */
  hasSeenWelcome: boolean;
  /** True if this user has enrolled a biometric credential on at least one device */
  hasBiometricEnrolled: boolean;
  updatedAt?: any;
}

export type ProfileUpdatePayload = Partial<Omit<UserProfileDoc, 'uid' | 'createdAt'>>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function profileRef(uid: string) {
  return doc(db, 'users', uid, 'meta', 'profile');
}

/** Generate a cryptographically random 32-byte salt, base64url-encoded */
function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  // base64url encode
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const PBKDF2_ITERATIONS = 100_000;

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Load the profile doc for a uid from Firestore.
 * Returns null if the doc doesn't exist yet.
 */
export async function loadUserProfile(uid: string): Promise<UserProfileDoc | null> {
  try {
    const snap = await getDoc(profileRef(uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfileDoc;
  } catch {
    return null;
  }
}

/**
 * Create a fresh profile document for a brand-new user.
 * Uses a Firestore transaction to avoid duplicate creation on double-call.
 */
export async function createUserProfile(
  uid: string,
  overrides: Partial<UserProfileDoc> = {}
): Promise<UserProfileDoc> {
  const now = new Date().toISOString();
  const profile: UserProfileDoc = {
    uid,
    createdAt: now,
    emailVerified: false,
    hasPin: false,
    pinHash: null,
    pinSalt: null,
    pinIterations: PBKDF2_ITERATIONS,
    pinFailCount: 0,
    lockedUntil: 0,
    hasSeenWelcome: false,
    hasBiometricEnrolled: false,
    ...overrides,
  };

  await setDoc(profileRef(uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
  return profile;
}

/**
 * Partial update of the profile document.
 */
export async function updateUserProfile(uid: string, payload: ProfileUpdatePayload): Promise<void> {
  try {
    await updateDoc(profileRef(uid), { ...payload, updatedAt: serverTimestamp() });
  } catch {
    // Doc may not exist yet — fall back to setDoc merge
    try {
      await setDoc(profileRef(uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      // Silent fail on network error; will sync when reconnected
    }
  }
}

/**
 * Hash a 4-digit PIN with a fresh random salt and store the result in the profile doc.
 * Returns the new profile state (hasPin: true).
 */
export async function setProfilePin(uid: string, rawPin: string): Promise<void> {
  const salt = generateSalt();
  const hash = await hashPinPBKDF2(rawPin, salt);
  await updateUserProfile(uid, {
    hasPin: true,
    pinHash: hash,
    pinSalt: salt,
    pinIterations: PBKDF2_ITERATIONS,
    pinFailCount: 0,
    lockedUntil: 0,
  });
}

/**
 * Verify a PIN against the profile doc.
 * Records failed attempts and applies lockout in Firestore (cross-device).
 * Returns { valid, locked, remainingSeconds, attemptsRemaining }.
 */
export async function verifyProfilePin(
  uid: string,
  profile: UserProfileDoc,
  enteredPin: string
): Promise<{
  valid: boolean;
  locked: boolean;
  remainingSeconds: number;
  attemptsRemaining: number;
}> {
  const now = Date.now();

  // Lockout check
  if (profile.lockedUntil && profile.lockedUntil > now) {
    const remainingSeconds = Math.ceil((profile.lockedUntil - now) / 1000);
    return { valid: false, locked: true, remainingSeconds, attemptsRemaining: 0 };
  }

  if (!profile.pinHash || !profile.pinSalt) {
    // No PIN set — treat as valid (shouldn't happen in guarded flow)
    return { valid: true, locked: false, remainingSeconds: 0, attemptsRemaining: 5 };
  }

  const isValid = await verifyPinPBKDF2(enteredPin, profile.pinHash!, profile.pinSalt!, profile.pinIterations || PBKDF2_ITERATIONS);

  if (isValid) {
    // Reset fail counter
    if (profile.pinFailCount > 0) {
      await updateUserProfile(uid, { pinFailCount: 0, lockedUntil: 0 }).catch(() => {});
    }
    return { valid: true, locked: false, remainingSeconds: 0, attemptsRemaining: 5 };
  }

  // Record failure
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATIONS_MS = [0, 0, 30_000, 120_000, 300_000, 900_000]; // escalating: 30s, 2m, 5m, 15m
  const newCount = (profile.pinFailCount || 0) + 1;
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - newCount);
  let lockedUntil = 0;

  if (newCount >= MAX_ATTEMPTS) {
    const delay = LOCKOUT_DURATIONS_MS[Math.min(newCount - MAX_ATTEMPTS + 2, LOCKOUT_DURATIONS_MS.length - 1)];
    lockedUntil = Date.now() + (delay || 900_000);
  }

  await updateUserProfile(uid, { pinFailCount: newCount, lockedUntil }).catch(() => {});

  const locked = lockedUntil > 0;
  const remainingSeconds = locked ? Math.ceil((lockedUntil - now) / 1000) : 0;

  return { valid: false, locked, remainingSeconds, attemptsRemaining };
}

/**
 * Remove PIN from the profile doc.
 */
export async function clearProfilePin(uid: string): Promise<void> {
  await updateUserProfile(uid, {
    hasPin: false,
    pinHash: null,
    pinSalt: null,
    pinFailCount: 0,
    lockedUntil: 0,
  });
}

/**
 * Mark the welcome screen as seen (persists across devices via Firestore).
 */
export async function markWelcomeSeen(uid: string): Promise<void> {
  await updateUserProfile(uid, { hasSeenWelcome: true });
  // Also mirror to localStorage for instant read on next boot
  try {
    localStorage.setItem(`flouss_welcome_${uid}`, 'true');
  } catch {}
}

/**
 * Mark the user's email as verified in the profile doc.
 */
export async function markEmailVerified(uid: string): Promise<void> {
  await updateUserProfile(uid, { emailVerified: true });
}
