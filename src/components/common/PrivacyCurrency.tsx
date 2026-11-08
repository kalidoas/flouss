import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatMAD } from '../../utils/formatters';

export interface PrivacyCurrencyProps {
  amount: number | string | null | undefined;
  showSign?: boolean;
  className?: string;
  forceVisible?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: boolean;
}

/**
 * Silicon Valley Grade Privacy Currency Wrapper
 * Selectively blurs sensitive monetary amounts with `blur-md opacity-50 select-none`
 * without affecting surrounding labels or non-monetary counters.
 */
export const PrivacyCurrency: React.FC<PrivacyCurrencyProps> = ({
  amount,
  showSign = false,
  className = '',
  forceVisible = false,
  prefix = '',
  suffix = '',
  decimals = false,
}) => {
  const { isBalanceHidden, hideBalance, language } = useAppStore();
  const isHidden = !forceVisible && (isBalanceHidden ?? hideBalance);

  const numVal =
    typeof amount === 'number' && !isNaN(amount)
      ? amount
      : parseFloat(String(amount || 0)) || 0;

  const formattedAmount = formatMAD(numVal, false, language);

  return (
    <span
      className={`tabular-nums inline-flex items-center whitespace-nowrap transition-[filter,opacity] duration-200 ${
        isHidden ? 'blur-md opacity-50 select-none pointer-events-none' : ''
      } ${className}`}
    >
      {prefix}
      {showSign && numVal > 0 && '+'}
      {formattedAmount}
      {suffix}
    </span>
  );
};

// Canonical money primitive name for new UI; keep the existing export so
// current screens can migrate without changing behavior.
export const MoneyText = PrivacyCurrency;
