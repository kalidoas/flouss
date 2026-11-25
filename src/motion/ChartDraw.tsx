import React from 'react';
import { motion, type SVGMotionProps } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';

export interface ChartDrawProps extends Omit<SVGMotionProps<SVGPathElement>, 'd'> { d: string; duration?: number; }
export const ChartDraw: React.FC<ChartDrawProps> = ({ d, duration = 0.6, ...props }) => {
  const reduced = useMotionPrefs();
  return <motion.path d={d} pathLength={1} initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ pathLength: { duration: reduced ? 0 : duration, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: reduced ? 0 : 0.2 } }} {...props} />;
};
