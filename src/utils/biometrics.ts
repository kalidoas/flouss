/**
 * Flouss Biometrics & WebAuthn Platform Authenticator Utility
 * Enforces platform-only biometrics (Face ID, Touch ID, Windows Hello, Android Biometrics)
 * without generic cross-device or security key passkey dialogs.
 */

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if the current device/browser supports platform authenticators (Face ID, Touch ID, etc.)
 */
export async function isPlatformBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Check if the user has enrolled biometrics on this device
 */
export async function isBiometricsEnrolled(uid: string): Promise<boolean> {
  if (!uid || typeof window === 'undefined') return false;
  const isAvailable = await isPlatformBiometricsAvailable();
  if (!isAvailable) return false;
  const credId = localStorage.getItem(`flouss_biometric_${uid}`);
  return Boolean(credId && credId.trim().length > 0);
}

/**
 * Enroll platform authenticator (Face ID / Touch ID) for this specific user
 */
export async function enrollPlatformBiometrics(
  uid: string,
  email?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAvailable = await isPlatformBiometricsAvailable();
    if (!isAvailable) {
      return { success: false, error: 'Platform authenticator not available' };
    }

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = new TextEncoder().encode(uid);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Flouss',
          id: window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: email || uid,
          displayName: email || 'Flouss User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const credIdBase64 = bufferToBase64(credential.rawId);
      localStorage.setItem(`flouss_biometric_${uid}`, credIdBase64);
      return { success: true };
    }
    return { success: false, error: 'No credential returned' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Biometric enrollment cancelled or failed' };
  }
}

/**
 * Authenticate using registered platform biometrics
 * Falls back silently on cancel or failure.
 */
export async function authenticateWithPlatformBiometrics(uid: string): Promise<boolean> {
  if (!uid || typeof window === 'undefined') return false;
  try {
    const credIdBase64 = localStorage.getItem(`flouss_biometric_${uid}`);
    if (!credIdBase64) return false;

    const credId = base64ToBuffer(credIdBase64);
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: credId,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return Boolean(assertion);
  } catch {
    // User cancelled or verification failed: silent fallback to PIN keypad
    return false;
  }
}

/**
 * Remove enrolled biometrics for a user
 */
export function removePlatformBiometrics(uid: string): void {
  if (typeof window !== 'undefined' && uid) {
    localStorage.removeItem(`flouss_biometric_${uid}`);
  }
}
