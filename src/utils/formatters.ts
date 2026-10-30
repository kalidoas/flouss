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
 * Combines date string "YYYY-MM-DD" and time "HH:mm" to ISO string.
 * If date already includes 'T', parses as is.
 */
export function toIsoDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  const time = timeStr || getCurrentTimeStr();
  const fullStr = `${dateStr}T${time}:00`;
  const d = new Date(fullStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Extract "YYYY-MM-DD" from an ISO timestamp or date string
 */
export function isoToDateInput(isoString: string): string {
  if (!isoString) return getTodayDateStr();
  if (isoString.includes('T')) {
    return isoString.split('T')[0];
  }
  return isoString;
}

/**
 * Extract "HH:mm" from an ISO timestamp
 */
export function isoToTimeInput(isoString: string): string {
  if (!isoString || !isoString.includes('T')) return '12:00';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '12:00';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
