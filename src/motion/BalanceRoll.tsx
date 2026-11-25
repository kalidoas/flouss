import React, { useEffect, useState } from 'react';
import { Money } from '../components/common/Money';
import { useMotionPrefs } from './useMotionPrefs';

export interface BalanceRollProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
  forceVisible?: boolean;
}

export const BalanceRoll: React.FC<BalanceRollProps> = ({
  value,
  duration = 320,
  className,
  showSign,
  forceVisible,
}) => {
  const reduced = useMotionPrefs();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (reduced || !Number.isFinite(value)) {
      setDisplayValue(value);
      return;
    }
    const start = displayValue;
    if (start === value) return;
    let raf = 0;
    let began = 0;
    const tick = (now: number) => {
      if (!began) began = now;
      const t = Math.min(1, (now - began) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplayValue(start + (value - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return <Money amount={reduced ? value : displayValue} showSign={showSign} forceVisible={forceVisible} className={className} />;
};
