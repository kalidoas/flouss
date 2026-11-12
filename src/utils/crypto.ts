/**
 * Flouss Security & Cryptography Utilities
 * - PBKDF2 PIN hashing with per-user random salt (profile doc path)
 * - Legacy SHA-256 PIN hashing with deterministic salt (backward compat)
 * - AES-GCM 256-bit Backup Encryption & Backward-Compatible Decryption
 */

const DEFAULT_PIN_SALT = 'flouss_pin_salt_v1';
const DEFAULT_BACKUP_SECRET = 'flouss_backup_secure_vault_v1';

/**
 * Hash a 4-digit PIN using PBKDF2-SHA-256 with a random salt (base64url-encoded).
 * This is the SECURE path used by the profile doc. The salt must be stored alongside
 * the hash (never hardcode or derive it from uid).
 */
export async function hashPinPBKDF2(
  pin: string,
  saltBase64: string,
  iterations: number = 100_000
): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback: SHA-256 with salt (not ideal but functional without SubtleCrypto)
    return hashPin(pin, saltBase64);
  }
  const pinBytes = new TextEncoder().encode(String(pin).trim());
  // Decode base64url salt
  const saltNorm = saltBase64.replace(/-/g, '+').replace(/_/g, '/');
  const saltBin = atob(saltNorm);
  const saltBytes = new Uint8Array(saltBin.length);
  for (let i = 0; i < saltBin.length; i++) saltBytes[i] = saltBin.charCodeAt(i);

  const keyMaterial = await crypto.subtle.importKey('raw', pinBytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a PIN using PBKDF2 against a stored hash and random salt.
 * Used exclusively by the profile doc path.
 */
export async function verifyPinPBKDF2(
  enteredPin: string,
  storedHash: string,
  saltBase64: string,
  iterations: number = 100_000
): Promise<boolean> {
  const hash = await hashPinPBKDF2(enteredPin, saltBase64, iterations);
  // Constant-time comparison (best effort in JS)
  if (hash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hash a 4-digit PIN using SHA-256 with salt.
 * @deprecated Use hashPinPBKDF2 for new PIN storage. This is kept for backward
 * compatibility with PINs stored in the main account doc before Phase 1 migration.
 */
export async function hashPin(pin: string, salt: string = DEFAULT_PIN_SALT): Promise<string> {
  const normalizedPin = String(pin).trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(`${salt}:${normalizedPin}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic fallback for environments without crypto.subtle
  let hash = 0;
  const str = `${salt}:${normalizedPin}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `flouss_h_${Math.abs(hash)}`;
}

/**
 * Verify an entered PIN against a stored PIN.
 * Supports backward compatibility for legacy 4-character plain text PINs
 * and automatically signals upgrade to UID-salted SHA-256 hash.
 */
export async function verifyPin(
  enteredPin: string,
  storedPin: string | null | undefined,
  salt: string = DEFAULT_PIN_SALT
): Promise<{ isValid: boolean; needsUpgrade: boolean }> {
  if (!storedPin) {
    return { isValid: true, needsUpgrade: false };
  }

  const cleanEntered = String(enteredPin).trim();
  const cleanStored = String(storedPin).trim();

  // 1. Legacy plain-text PIN (4 digits)
  if (cleanStored.length === 4) {
    const isMatch = cleanEntered === cleanStored;
    return { isValid: isMatch, needsUpgrade: isMatch };
  }

  // 2. Modern hashed PIN with provided salt (e.g. UID + salt)
  const enteredHash = await hashPin(cleanEntered, salt);
  if (enteredHash === cleanStored) {
    return { isValid: true, needsUpgrade: false };
  }

  // 3. Fallback: Check if stored was hashed with DEFAULT_PIN_SALT without UID
  if (salt !== DEFAULT_PIN_SALT) {
    const legacyHash = await hashPin(cleanEntered, DEFAULT_PIN_SALT);
    if (legacyHash === cleanStored) {
      return { isValid: true, needsUpgrade: true };
    }
  }

  return { isValid: false, needsUpgrade: false };
}

const LOCKOUT_KEY_PREFIX = 'flouss_pin_lockout_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
}

export function getPinLockoutStatus(uid: string = 'default'): LockoutStatus {
  try {
    const raw = localStorage.getItem(`${LOCKOUT_KEY_PREFIX}${uid}`);
    if (!raw) return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockedUntil && data.lockedUntil > now) {
      const remaining = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds: remaining, attemptsCount: data.attempts || MAX_ATTEMPTS };
    }
    return { isLocked: false, remainingSeconds: 0, attemptsCount: data.attempts || 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
  }
}

export function recordFailedPinAttempt(uid: string = 'default'): LockoutStatus {
  try {
    const current = getPinLockoutStatus(uid);
    const newCount = current.attemptsCount + 1;
    let lockedUntil = 0;
    if (newCount >= MAX_ATTEMPTS) {
      lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
    localStorage.setItem(
      `${LOCKOUT_KEY_PREFIX}${uid}`,
      JSON.stringify({ attempts: newCount, lockedUntil })
    );
    return getPinLockoutStatus(uid);
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 1 };
  }
}

export function resetPinLockout(uid: string = 'default'): void {
  try {
    localStorage.removeItem(`${LOCKOUT_KEY_PREFIX}${uid}`);
  } catch {}
}

export interface EncryptedBackupPayload {
  version: 2;
  encrypted: true;
  algorithm: 'AES-GCM-256';
  iv: string;
  salt: string;
  ciphertext: string;
  exportedAt: string;
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a backup object into an AES-GCM encrypted payload.
 */
export async function encryptBackup(
  data: unknown,
  secret: string = DEFAULT_BACKUP_SECRET
): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback: return formatted JSON if Web Crypto is unavailable
    return JSON.stringify(data);
  }

  try {
    const plaintext = JSON.stringify(data);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(secret, salt);

    const encoded = new TextEncoder().encode(plaintext);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      encoded
    );

    const payload: EncryptedBackupPayload = {
      version: 2,
      encrypted: true,
      algorithm: 'AES-GCM-256',
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
      ciphertext: bufferToBase64(encryptedBuffer),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(payload, null, 2);
  } catch (err) {
    console.warn('Backup encryption failed, falling back to JSON:', err);
    return JSON.stringify(data);
  }
}

/**
 * Recursively sanitizes an object against Prototype Pollution.
 * Strips __proto__, constructor, and prototype properties.
 */
export function sanitizeObject<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeObject) as unknown as T;
  }

  const clean: Record<string, any> = {};
  for (const key of Object.keys(input)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeObject((input as Record<string, any>)[key]);
  }
  return clean as T;
}

const MAX_BACKUP_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * Decrypt a backup file string, or parse if it is an unencrypted legacy JSON backup.
 * Hardened against Prototype Pollution and oversized payloads.
 */
export async function decryptBackup<T = any>(
  rawContent: string,
  secret: string = DEFAULT_BACKUP_SECRET
): Promise<T | null> {
  if (typeof rawContent !== 'string' || rawContent.length > MAX_BACKUP_SIZE_BYTES) {
    console.error('Backup payload exceeds 15MB size limit or is invalid');
    return null;
  }

  try {
    const parsed = JSON.parse(rawContent);

    // If it's a standard unencrypted legacy backup:
    if (!parsed || parsed.encrypted !== true || !parsed.ciphertext) {
      return sanitizeObject(parsed) as T;
    }

    // It's an encrypted backup
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      console.error('Web Crypto API not available to decrypt backup');
      return null;
    }

    const payload = parsed as EncryptedBackupPayload;
    const iv = base64ToUint8Array(payload.iv);
    const salt = base64ToUint8Array(payload.salt);
    const ciphertext = base64ToUint8Array(payload.ciphertext);

    const key = await deriveAesKey(secret, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    const decryptedParsed = JSON.parse(decryptedText);
    return sanitizeObject(decryptedParsed) as T;
  } catch (err) {
    console.error('Failed to parse or decrypt backup:', err);
    return null;
  }
}
