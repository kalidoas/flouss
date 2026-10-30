import React from 'react';
import { useAppStore } from '../../store/useAppStore';

interface FormattedAmountProps {
  amount: number | null | undefined;
  className?: string;
  prefix?: string;
  isPositive?: boolean;
  isNegative?: boolean;
}

export const FormattedAmount: React.FC<FormattedAmountProps> = ({
  amount,
  className = '',
  prefix = '',
  isPositive,
  isNegative,
}) => {
  const { hideBalance, language } = useAppStore();
  const currencySymbol = language === 'ar' ? 'د.م.' : 'MAD';

  if (amount === null || amount === undefined || isNaN(amount)) {
    return (
      <span className={`tabular-nums ${hideBalance ? 'privacy-blur' : ''} ${className}`}>
        {prefix}0,00 {currencySymbol}
      </span>
    );
  }

  const parts = Math.abs(amount).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decimalPart = parts[1];
  const sign = amount < 0 ? '-' : '';

  const colorClass =
    isPositive !== undefined
      ? isPositive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400'
      : isNegative
      ? 'text-rose-600 dark:text-rose-400'
      : '';

  return (
    <span
      className={`tabular-nums transition-[filter] duration-200 ${
        hideBalance ? 'privacy-blur' : ''
      } ${colorClass} ${className}`}
    >
      {prefix}
      {sign}
      {integerPart},{decimalPart} {currencySymbol}
    </span>
  );
};
