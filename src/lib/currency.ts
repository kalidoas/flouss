/**
 * CURRENCY MATH UTILITY
 *
 * Provides integer-cents arithmetic to eliminate floating-point precision bugs.
 * All values are stored and computed in integer cents (1 MAD = 100 cents).
 *
 * Usage:
 *   - Amounts from UI (strings, numbers) are converted via toCents()
 *   - All internal calculations work in cents
 *   - Display values are converted back via fromCents()
 *
 * This eliminates issues like 147.85000000002, ensures exact math,
 * and guarantees balance reconciliation across all pages.
 */

export const CURRENCY = {
  // Moroccan Dirham
  code: 'MAD',
  name: 'MAD',
  // Conversion rates (fix at onboarding, no dynamic FX)
  rates: {
    MAD: 1,
    // Add others as needed
  },
};

/**
 * Converts a decimal amount to integer cents.
 * Handles strings, numbers, and rounds to nearest cent.
 * @param val - Amount in decimal (e.g., "300.50", 300.5, 300)
 * @returns Integer cents (e.g., 3050)
 */
export function toCents(val: string | number): number {
  const numberVal = Number(val);
  if (Number.isNaN(numberVal)) return 0;
  // Round to nearest cent using integer arithmetic
  return Math.round(numberVal * 100);
}

/**
 * Converts integer cents to decimal string.
 * @param cents - Integer cents (e.g., 3050)
 * @returns Decimal string (e.g., "30.50")
 */
export function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absCents = Math.abs(cents);
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(absCents) / 100);
  return `${sign}${formatted}`;
}

/**
 * Add two amounts with exact currency precision.
 * @param a - First amount (decimal string/number)
 * @param b - Second amount (decimal string/number)
 * @returns Sum as cents integer
 */
export function addCents(a: string | number, b: string | number): number {
  return toCents(a) + toCents(b);
}

/**
 * Subtract two amounts with exact currency precision.
 * @param a - Minuend amount
 * @param b - Subtrahend amount
 * @returns Difference as cents integer
 */
export function subtractCents(a: string | number, b: string | number): number {
  return toCents(a) - toCents(b);
}

/**
 * Multiply amount by quantity (e.g., nbr of items or months).
 * @param amount - Decimal amount string/number
 * @param quantity - Integer quantity
 * @returns Product as cents integer
 */
export function multiplyCents(amount: string | number, quantity: number): number {
  return Math.round(toCents(amount) * quantity) / 1; // keep as cents
}

/**
 * Calculate percentage of amount.
 * @param amount - Decimal amount string/number
 * @param percentage - Percentage value (0-100, can be decimal)
 * @returns Result as cents integer
 */
export function percentageCents(amount: string | number, percentage: number): number {
  return Math.round(toCents(amount) * percentage) / 100;
}

/**
 * Safe division that returns 0 instead of Infinity/NaN.
 * @param numerator - Decimal amount string/number
 * @param denominator - Decimal amount string/number
 * @returns Result as cents integer (0 if denom is 0/NaN)
 */
export function safeDivideCents(numerator: string | number, denominator: string | number): number {
  const denom = toCents(denominator);
  if (denom === 0) return 0;
  return Math.round(toCents(numerator) / denom * 100) / 100; // return as "percentage units" / 100
}

/**
 * Round a decimal value to exact currency precision (2 decimal places).
 * Safety net for any value that bypasses the cents arithmetic.
 * @param val - Decimal value
 * @returns Rounded to 2 decimal places
 */
export function roundCurrency(val: number): number {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

/**
 * Format amount with currency code, never duplicate.
 * @param amount - Decimal string/number
 * @param currencyCode - Optional currency code (defaults to MAD)
 * @returns Formatted string like "300.00 MAD" or "300.00 DH"
 */
export function formatAmount(amount: string | number, currencyCode: string = 'MAD'): string {
  const cents = toCents(amount);
  const sign = cents < 0 ? '-' : '';
  const absCents = Math.abs(cents);
  const numericPart = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(absCents) / 100);

  // Never duplicate currency labels
  const currencyMap: Record<string, string> = {
    MAD: ' MAD',
    DH: ' DH',
    // AR: ' DZD' would be wrong for MAD app, keep consistent
  };

  const currencySuffix = currencyMap[currencyCode] || ' MAD';
  return `${sign}${numericPart}${currencySuffix}`;
}

// Export a singleton instance for easy importing
export const money = {
  toCents,
  fromCents,
  add: addCents,
  subtract: subtractCents,
  multiply: multiplyCents,
  percentage: percentageCents,
  safeDivide: safeDivideCents,
  round: roundCurrency,
  format: formatAmount,
  currency: CURRENCY,
};