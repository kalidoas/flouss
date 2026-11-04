import { Language } from '../types';

/**
 * Format currency in Moroccan Dirhams (MAD)
 * Example: 1250 -> "1 250,00 MAD" or "1 250,00 د.م."
 * Always uses Western digits 0-9 even in Arabic.
 */
export function formatMAD(
  amount: number | null | undefined,
  hide: boolean = false,
  language: Language = 'fr'
): string {
  const currencySymbol = language === 'ar' ? 'د.م.' : 'MAD';
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0,00 ${currencySymbol}`;
  }

  const parts = Math.abs(amount).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decimalPart = parts[1];

  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${integerPart},${decimalPart} ${currencySymbol}`;
}

/**
 * Resolve Intl locale with Western digits (0-9) even in Arabic
 */
export function getIntlLocale(language: Language = 'fr'): string {
  if (language === 'ar') return 'ar-MA-u-nu-latn';
  if (language === 'en') return 'en-US';
  return 'fr-FR';
}

/**
 * Format date based on active locale
 */
export function formatDate(dateString: string, language: Language = 'fr'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    if (language === 'ar') return 'اليوم';
    if (language === 'en') return 'Today';
    return "Aujourd'hui";
  }
  if (isYesterday) {
    if (language === 'ar') return 'أمس';
    if (language === 'en') return 'Yesterday';
    return 'Hier';
  }

  const locale = getIntlLocale(language);

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

/**
 * Format full date and time (e.g. "27 oct. 2026 · 23:05")
 */
export function formatDateTime(dateString: string, language: Language = 'fr'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const locale = getIntlLocale(language);
  const datePart = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${datePart} · ${hours}:${minutes}`;
}

/**
 * Format month label (e.g., "Octobre 2026" or "أكتوبر 2026")
 */
export function formatMonthYear(monthStr: string, language: Language = 'fr'): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const locale = getIntlLocale(language);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Get current year and month as "YYYY-MM"
 */
export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get today's date formatted as "YYYY-MM-DD"
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time formatted as "HH:mm"
 */
export function getCurrentTimeStr(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a local Date object into RFC 3339 / ISO 8601 with exact local timezone offset (+HH:MM / -HH:MM)
 * Prevents UTC midnight drift across month boundaries.
 */
export function formatLocalIsoWithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}

/**
 * Combines date string "YYYY-MM-DD" and time "HH:mm" to ISO string with local timezone offset.
 * If date already includes 'T', parses and formats with offset.
 */
export function toIsoDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) dateStr = getTodayDateStr();
  const time = timeStr || getCurrentTimeStr();
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : formatLocalIsoWithOffset(d);
  }
  const fullStr = `${dateStr}T${time}:00`;
  const d = new Date(fullStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : formatLocalIsoWithOffset(d);
}

/**
 * Accurately determines if a transaction date string belongs to the target month ("YYYY-MM").
 * Checks:
 * 1. Fast direct prefix match
 * 2. Local date parsing (handling UTC vs local midnight/timezone shifts)
 * 3. UTC date parsing (for legacy ISO UTC strings)
 * 4. Boundary grace window (+/- 24h) for timestamps affected by UTC vs local timezone offsets
 */
export function isTransactionInMonth(dateStr: string | undefined | null, targetMonth: string): boolean {
  if (!dateStr || !targetMonth) return false;
  if (dateStr.startsWith(targetMonth)) return true;

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    // Local timezone match (the user's browser local time)
    const localYear = d.getFullYear();
    const localMonth = String(d.getMonth() + 1).padStart(2, '0');
    if (`${localYear}-${localMonth}` === targetMonth) return true;

    // UTC match fallback
    const utcYear = d.getUTCFullYear();
    const utcMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
    if (`${utcYear}-${utcMonth}` === targetMonth) return true;

    // Boundary grace window (+/- 24h) for timestamps recorded near UTC midnight:
    // e.g. Oct 31 23:30 UTC is Nov 1 00:30 in UTC+1 (Morocco/France).
    const [tYear, tMonth] = targetMonth.split('-').map(Number);
    if (tYear && tMonth) {
      const startOfMonthUtc = Date.UTC(tYear, tMonth - 1, 1, 0, 0, 0);
      const endOfMonthUtc = Date.UTC(tYear, tMonth, 0, 23, 59, 59, 999);
      const time = d.getTime();
      const dayMs = 24 * 60 * 60 * 1000;

      // Within 24h before month start (local time was already the 1st in UTC+ offset zones)
      if (time >= startOfMonthUtc - dayMs && time < startOfMonthUtc) {
        return true;
      }
      // Within 24h after month end (local time was still the last day in UTC- offset zones)
      if (time > endOfMonthUtc && time <= endOfMonthUtc + dayMs) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Get the local "YYYY-MM" month string from any valid date or ISO string
 */
export function getTransactionMonth(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
  } catch {}
  return dateStr.slice(0, 7);
}

/**
 * Extract "YYYY-MM-DD" from an ISO timestamp or date string in local time
 */
export function isoToDateInput(isoString: string): string {
  if (!isoString) return getTodayDateStr();
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {}
  if (isoString.includes('T')) {
    return isoString.split('T')[0];
  }
  return isoString;
}

/**
 * Extract "HH:mm" from an ISO timestamp in local time
 */
export function isoToTimeInput(isoString: string): string {
  if (!isoString) return '12:00';
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch {}
  return '12:00';
}
