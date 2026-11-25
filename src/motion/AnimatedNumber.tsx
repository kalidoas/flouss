import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { Money } from '../components/common/Money';
import { useMotionPrefs } from './useMotionPrefs';
import { motionDurations } from './tokens';

export interface AnimatedNumberProps {
  value: number;
  hide?: boolean;
  language?: Language;
  duration?: number; // ms
  className?: string;
  format?: 'currency' | 'percent' | 'integer' | 'custom';
  formatter?: (val: number) => string;
  unit?: string;
  prefix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  hide = false,
  language = 'fr',
  duration = motionDurations.slowMs,
  className = '',
  format = 'currency',
  formatter,
  unit,
  prefix = '',
}) => {
  const prefersReducedMotion = useMotionPrefs();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, prefersReducedMotion]);

  const activeValue = prefersReducedMotion ? value : displayValue;

  if (!formatter && format === 'currency') {
    return <Money amount={activeValue} language={language} hide={hide ? true : undefined} prefix={prefix} suffix={unit ? ` ${unit}` : ''} className={className} />;
  }

  let formatted = '';
  if (formatter) {
    formatted = formatter(activeValue);
  } else if (format === 'percent') {
    formatted = `${Math.round(activeValue)}%`;
  } else if (format === 'integer') {
    const locale = language === 'ar' ? 'ar-MA-u-nu-latn' : language === 'en' ? 'en-US' : 'fr-FR';
    formatted = Math.round(activeValue).toLocaleString(locale);
  } else {
    formatted = String(Math.round(activeValue * 100) / 100);
  }

  return (
    <span
      className={`tabular-nums transition-[filter] duration-200 ${hide ? 'privacy-blur' : ''} ${className}`}
    >
      {prefix}{formatted}{unit ? ` ${unit}` : ''}
    </span>
  );
};
