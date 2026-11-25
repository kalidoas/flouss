import React, { useEffect, useState } from 'react';
import { Money } from './Money';
import { Language } from '../../types';

interface CountUpNumberProps {
  value: number;
  hide?: boolean;
  language?: Language;
  duration?: number; // ms
  className?: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  hide = false,
  language = 'fr',
  duration = 800,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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
  }, [value, duration]);

  return (
    <span className={`tabular-nums transition-[filter] duration-200 ${hide ? 'privacy-blur' : ''} ${className}`}>
      <Money amount={displayValue} language={language} hide={hide ? true : undefined} />
    </span>
  );
};
