/**
 * Flouss Security & Cryptography Utilities
 * - Web Crypto SHA-256 PIN hashing with salt
 * - AES-GCM 256-bit Backup Encryption & Backward-Compatible Decryption
 */

const DEFAULT_PIN_SALT = 'flouss_pin_salt_v1';
const DEFAULT_BACKUP_SECRET = 'flouss_backup_secure_vault_v1';

/**
 * Hash a 4-digit PIN using SHA-256 with salt.
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
 * Supports backward compatibility for legacy 4-character plain text PINs.
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

  // Legacy plain-text PIN (4 digits)
  if (cleanStored.length === 4) {
    const isMatch = cleanEntered === cleanStored;
    return { isValid: isMatch, needsUpgrade: isMatch };
  }

  // Modern hashed PIN (SHA-256 hex is 64 characters)
  const enteredHash = await hashPin(cleanEntered, salt);
  return { isValid: enteredHash === cleanStored, needsUpgrade: false };
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
 * Decrypt a backup file string, or parse if it is an unencrypted legacy JSON backup.
 */
export async function decryptBackup<T = any>(
  rawContent: string,
  secret: string = DEFAULT_BACKUP_SECRET
): Promise<T | null> {
  try {
    const parsed = JSON.parse(rawContent);

    // If it's a standard unencrypted legacy backup:
    if (!parsed || parsed.encrypted !== true || !parsed.ciphertext) {
      return parsed as T;
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
    return JSON.parse(decryptedText) as T;
  } catch (err) {
    console.error('Failed to parse or decrypt backup:', err);
    return null;
  }
}
