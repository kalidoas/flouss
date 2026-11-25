import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Language } from '../../types';
import { Money } from './Money';

export interface AnimatedCurrencyProps {
  value: number;
  language?: Language;
  hideBalance?: boolean;
  className?: string;
  showCurrency?: boolean;
  prefix?: string;
}

/** Motion wrapper; Money remains the single source of displayed currency formatting. */
export const AnimatedCurrency: React.FC<AnimatedCurrencyProps> = ({ value, language, hideBalance = false, className = '', showCurrency = true, prefix = '' }) => {
  const previous = useRef(value);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    if (value !== previous.current) {
      setDirection(value > previous.current ? 'up' : 'down');
      previous.current = value;
      const timer = window.setTimeout(() => setDirection(null), 320);
      return () => window.clearTimeout(timer);
    }
  }, [value]);

  return <motion.span animate={direction ? { y: [0, -2, 0], opacity: [0.8, 1, 1] } : { y: 0, opacity: 1 }} transition={{ duration: 0.32 }} className={className}>
    <Money amount={value} language={language} hide={hideBalance} prefix={prefix} currencyClassName={showCurrency ? undefined : 'sr-only'} />
  </motion.span>;
};
