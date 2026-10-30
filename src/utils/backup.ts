/**
 * Standalone offline backup utility
 * Safely exports raw localStorage data even if state hydration or application crashes.
 */

export function createEmergencyLocalStorageBackup(): string | null {
  try {
    const rawV2 = localStorage.getItem('flouss_app_storage_v2');
    const rawV1 = localStorage.getItem('flouss_app_storage_v1');
    const users = localStorage.getItem('flouss:users');

    const backupPayload = {
      timestamp: new Date().toISOString(),
      source: 'emergency_local_storage_backup',
      v2: rawV2 ? JSON.parse(rawV2) : null,
      v1: rawV1 ? JSON.parse(rawV1) : null,
      users: users ? JSON.parse(users) : null,
      allFloussKeys: {} as Record<string, unknown>,
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flouss')) {
        try {
          const item = localStorage.getItem(key);
          backupPayload.allFloussKeys[key] = item ? JSON.parse(item) : null;
        } catch {
          backupPayload.allFloussKeys[key] = localStorage.getItem(key);
        }
      }
    }

    // Save an emergency snapshot in localStorage
    localStorage.setItem('flouss_emergency_snapshot', JSON.stringify(backupPayload));
    return JSON.stringify(backupPayload, null, 2);
  } catch (err) {
    console.error('Failed to create emergency backup:', err);
    return null;
  }
}
