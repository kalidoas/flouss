/**
 * Standalone offline backup utility
 * Safely exports raw localStorage data even if state hydration or application crashes.
 */
import { migrateLegacyGoogleCalendar } from '../services/googleCalendar';

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

    localStorage.setItem('flouss_emergency_snapshot', JSON.stringify(backupPayload));
    return JSON.stringify(backupPayload, null, 2);
  } catch (err) {
    console.error('Failed to create emergency backup:', err);
    return null;
  }
}

export interface RollingBackupEntry {
  date: string; // YYYY-MM-DD
  timestamp: string;
  transactionCount: number;
  balance: number;
  account: any;
}

export function getRollingBackupsKey(uid?: string | null): string {
  return uid ? `flouss_rolling_backups_${uid}` : 'flouss_rolling_backups';
}

export function getPreSyncBackupKey(uid?: string | null): string {
  return uid ? `flouss_pre_sync_safety_backup_${uid}` : 'flouss_pre_sync_safety_backup';
}

export function saveRollingBackup(account: any, uid?: string | null): void {
  if (!account || !Array.isArray(account.transactions) || account.transactions.length === 0) {
    return;
  }
  const targetUid = uid || account?.id || null;
  const storageKey = getRollingBackupsKey(targetUid);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existingRaw = localStorage.getItem(storageKey);
    let backups: RollingBackupEntry[] = [];
    if (existingRaw) {
      try {
        backups = JSON.parse(existingRaw);
      } catch (e) {}
    }

    // Filter out any existing snapshot for today so we only keep the latest of today
    backups = backups.filter((b) => b.date !== today);

    backups.unshift({
      date: today,
      timestamp: new Date().toISOString(),
      transactionCount: account.transactions.length,
      balance: account.balance ?? 0,
      account: { ...account, id: targetUid || account.id },
    });

    // Keep only the last 7 daily snapshots
    if (backups.length > 7) {
      backups = backups.slice(0, 7);
    }

    localStorage.setItem(storageKey, JSON.stringify(backups));
  } catch (err) {
    console.warn('[Flouss Backup] Failed to save rolling backup:', err);
  }
}

export function getRollingBackups(uid?: string | null): RollingBackupEntry[] {
  const storageKey = getRollingBackupsKey(uid);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Strict isolation: if a uid is requested, refuse/filter out entries belonging to other uids
    if (uid) {
      return parsed.filter((b) => !b.account?.id || b.account.id === uid);
    }
    return parsed;
  } catch (e) {
    return [];
  }
}

export function savePreSyncSafetyBackup(account: any, uid?: string | null): void {
  if (!account) return;
  const targetUid = uid || account?.id || null;
  const storageKey = getPreSyncBackupKey(targetUid);
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      transactionCount: Array.isArray(account.transactions) ? account.transactions.length : 0,
      balance: account.balance ?? 0,
      account: { ...account, id: targetUid || account.id },
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (e) {
    console.warn('[Flouss Backup] Failed to save pre-sync safety backup:', e);
  }
}

export function getPreSyncSafetyBackup(uid?: string | null): any | null {
  const storageKey = getPreSyncBackupKey(uid);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Refuse snapshot of another uid
    if (uid && parsed?.account?.id && parsed.account.id !== uid) {
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * One-time migration of existing un-namespaced values.
 * Attributes them to a uid ONLY if the payload carries that uid; otherwise deletes them.
 * Afterwards deletes all legacy un-namespaced keys.
 */
export function migrateLegacyBackups(currentUid: string, currentUserEmail?: string | null): void {
  if (!currentUid) return;

  // 1. Rolling backups migration
  const legacyRollingKey = 'flouss_rolling_backups';
  const legacyRolling = localStorage.getItem(legacyRollingKey);
  if (legacyRolling) {
    try {
      const parsed = JSON.parse(legacyRolling);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Attribute to currentUid ONLY if payload carries that uid
        const userEntries = parsed.filter((entry: any) => entry?.account?.id === currentUid);
        if (userEntries.length > 0) {
          const namespacedKey = getRollingBackupsKey(currentUid);
          if (!localStorage.getItem(namespacedKey)) {
            localStorage.setItem(namespacedKey, JSON.stringify(userEntries));
          }
        }
      }
    } catch {}
    localStorage.removeItem(legacyRollingKey);
  }

  // 2. Pre-sync safety backup migration
  const legacyPreSyncKey = 'flouss_pre_sync_safety_backup';
  const legacyPreSync = localStorage.getItem(legacyPreSyncKey);
  if (legacyPreSync) {
    try {
      const parsed = JSON.parse(legacyPreSync);
      if (parsed?.account?.id === currentUid) {
        const namespacedKey = getPreSyncBackupKey(currentUid);
        if (!localStorage.getItem(namespacedKey)) {
          localStorage.setItem(namespacedKey, legacyPreSync);
        }
      }
    } catch {}
    localStorage.removeItem(legacyPreSyncKey);
  }

  // 3. Google Calendar legacy keys migration
  migrateLegacyGoogleCalendar(currentUid, currentUserEmail);

  // 4. Clean up any remaining legacy un-namespaced keys
  const legacyUnNamespacedKeys = [
    'flouss_rolling_backups',
    'flouss_pre_sync_safety_backup',
    'flouss_emergency_snapshot',
    'flouss_user_default',
    'flouss-store',
  ];
  for (const k of legacyUnNamespacedKeys) {
    localStorage.removeItem(k);
  }
}

/**
 * Purge every flouss_* key associated with a specific uid from localStorage and sessionStorage.
 * Used on logout and on account switch to guarantee 100% data isolation.
 */
export function purgeUserStorage(uid: string): void {
  if (!uid) return;

  // 1. Purge from localStorage
  const localKeysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    // Matches any key that contains the user's UID or legacy un-namespaced default keys
    if (
      key.includes(uid) ||
      key === 'flouss_user_default' ||
      key === 'flouss-store' ||
      key === 'flouss_rolling_backups' ||
      key === 'flouss_pre_sync_safety_backup'
    ) {
      localKeysToRemove.push(key);
    }
  }
  for (const key of localKeysToRemove) {
    localStorage.removeItem(key);
  }

  // 2. Purge from sessionStorage
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key) continue;
    if (
      key.includes(uid) ||
      key.startsWith('flouss_google_')
    ) {
      sessionKeysToRemove.push(key);
    }
  }
  for (const key of sessionKeysToRemove) {
    sessionStorage.removeItem(key);
  }
}
