import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Language } from '../../types';

export interface AnimatedCurrencyProps {
  value: number;
  language?: Language;
  hideBalance?: boolean;
  className?: string;
  showCurrency?: boolean;
  prefix?: string;
}

export const AnimatedCurrency: React.FC<AnimatedCurrencyProps> = ({
  value,
  language = 'ar',
  hideBalance = false,
  className = '',
  showCurrency = true,
  prefix = '',
}) => {
  const prevValueRef = useRef(value);
  const [pulseColor, setPulseColor] = useState<'green' | 'red' | null>(null);

  // Smooth Apple spring for rolling numerical interpolation
  const springValue = useSpring(value, {
    stiffness: 280,
    damping: 30,
    mass: 0.6,
  });

  useEffect(() => {
    springValue.set(value);

    if (value !== prevValueRef.current) {
      if (value > prevValueRef.current) {
        setPulseColor('green');
      } else if (value < prevValueRef.current) {
        setPulseColor('red');
      }
      prevValueRef.current = value;

      const timer = setTimeout(() => {
        setPulseColor(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [value, springValue]);

  // Transform spring float into formatted currency string
  const displayValue = useTransform(springValue, (current) => {
    const rounded = Math.round(current * 100) / 100;
    const parts = rounded.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Format with standard thousands separator
    const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formattedInt},${decimalPart}`;
  });

  const currencySymbol =
    language === 'ar' ? 'د.م.' : language === 'en' ? 'MAD' : 'DH';

  return (
    <motion.span
      animate={
        pulseColor === 'green'
          ? { scale: [1, 1.03, 1], color: ['#10b981', '#10b981', 'inherit'] }
          : pulseColor === 'red'
          ? { scale: [1, 1.03, 1], color: ['#ef4444', '#ef4444', 'inherit'] }
          : { scale: 1 }
      }
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`inline-flex items-baseline gap-1 font-bold tabular-nums tracking-tight transition-[filter] duration-200 select-text ${
        hideBalance ? 'privacy-blur' : ''
      } ${className}`}
    >
      {prefix && <span>{prefix}</span>}

      <motion.span>{displayValue}</motion.span>

      {showCurrency && (
        <span className="text-[0.6em] font-medium opacity-75 ml-0.5 uppercase tracking-normal">
          {currencySymbol}
        </span>
      )}
    </motion.span>
  );
};
