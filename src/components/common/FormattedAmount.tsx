import React from 'react';
import { Money } from './Money';

interface FormattedAmountProps {
  amount: number | null | undefined;
  className?: string;
  prefix?: string;
  isPositive?: boolean;
  isNegative?: boolean;
}

/** Compatibility wrapper for older layouts; all formatting is delegated to Money. */
export const FormattedAmount: React.FC<FormattedAmountProps> = ({ amount, className = '', prefix = '', isPositive, isNegative }) => {
  const colorClass = isPositive === true ? 'text-emerald-600 dark:text-emerald-400' : isPositive === false || isNegative ? 'text-rose-600 dark:text-rose-400' : '';
  return <Money amount={amount} prefix={prefix} className={`${colorClass} ${className}`} />;
};
