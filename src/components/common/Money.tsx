import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatMADParts } from '../../utils/formatters';
import { Language } from '../../types';

export interface MoneyProps {
  amount: number | string | null | undefined;
  showSign?: boolean;
  className?: string;
  forceVisible?: boolean;
  hide?: boolean;
  prefix?: string;
  suffix?: string;
  language?: Language;
  currencyClassName?: string;
}

/** The canonical, privacy-aware renderer for every monetary amount in the UI. */
export const Money: React.FC<MoneyProps> = ({
  amount,
  showSign = false,
  className = '',
  forceVisible = false,
  hide,
  prefix = '',
  suffix = '',
  language: languageOverride,
  currencyClassName = 'text-current/65',
}) => {
  const appLanguage = useAppStore((state) => state.language);
  const appBalanceHidden = useAppStore((state) => state.isBalanceHidden ?? state.hideBalance);
  const language = languageOverride ?? appLanguage;
  const numVal = typeof amount === 'number' && Number.isFinite(amount)
    ? amount
    : Number.parseFloat(String(amount ?? 0)) || 0;
  const hidden = !forceVisible && (hide === true || appBalanceHidden);
  const parts = formatMADParts(numVal, language);
  const safePrefix = prefix.replace(/-/g, '−');

  return (
    <span dir="ltr" style={{ unicodeBidi: 'isolate' }} className={`tabular-nums inline-flex items-baseline whitespace-nowrap transition-[filter,opacity] duration-200 ${hidden ? 'privacy-blur select-none pointer-events-none' : ''} ${className}`}>
      {safePrefix}{showSign && numVal > 0 ? '+' : ''}{parts.number}{'\u00a0'}<span className={`font-medium ${currencyClassName}`}>{parts.currency}</span>{suffix}
    </span>
  );
};
