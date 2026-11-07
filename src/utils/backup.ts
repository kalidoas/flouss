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

const ROLLING_BACKUPS_KEY = 'flouss_rolling_backups';
const PRE_SYNC_BACKUP_KEY = 'flouss_pre_sync_safety_backup';

export function saveRollingBackup(account: any): void {
  if (!account || !Array.isArray(account.transactions) || account.transactions.length === 0) {
    return;
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existingRaw = localStorage.getItem(ROLLING_BACKUPS_KEY);
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
      account,
    });

    // Keep only the last 7 daily snapshots
    if (backups.length > 7) {
      backups = backups.slice(0, 7);
    }

    localStorage.setItem(ROLLING_BACKUPS_KEY, JSON.stringify(backups));
  } catch (err) {
    console.warn('[Flouss Backup] Failed to save rolling backup:', err);
  }
}

export function getRollingBackups(): RollingBackupEntry[] {
  try {
    const raw = localStorage.getItem(ROLLING_BACKUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function savePreSyncSafetyBackup(account: any): void {
  if (!account) return;
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      transactionCount: Array.isArray(account.transactions) ? account.transactions.length : 0,
      balance: account.balance ?? 0,
      account,
    };
    localStorage.setItem(PRE_SYNC_BACKUP_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[Flouss Backup] Failed to save pre-sync safety backup:', e);
  }
}

export function getPreSyncSafetyBackup(): any | null {
  try {
    const raw = localStorage.getItem(PRE_SYNC_BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
