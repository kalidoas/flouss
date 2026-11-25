import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';

export interface SwipeRowProps { children: React.ReactNode; actionLabel: string; onAction: () => void; className?: string; direction?: 'start' | 'end'; }
export const SwipeRow: React.FC<SwipeRowProps> = ({ children, actionLabel, onAction, className = '', direction = 'end' }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, direction === 'end' ? [-96, -32, 0] : [0, 32, 96], [1, 0.65, 0]);
  const reduced = useMotionPrefs();
  const sign = direction === 'end' ? -1 : 1;
  return <div className={`relative overflow-hidden ${className}`}>
    <button type="button" aria-label={actionLabel} onClick={onAction} className={`absolute inset-y-0 ${direction === 'end' ? 'right-0' : 'left-0'} px-4 bg-negative text-white font-semibold`}>{actionLabel}</button>
    <motion.div drag={reduced ? false : 'x'} dragConstraints={{ left: direction === 'end' ? -96 : 0, right: direction === 'start' ? 96 : 0 }} dragElastic={0.08} style={{ x, opacity }} onDragEnd={(_, info) => { if (info.offset.x * sign > 64) onAction(); }}>{children}</motion.div>
  </div>;
};
