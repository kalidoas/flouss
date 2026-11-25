import React from 'react';
import { motion } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';

export const PageTransition: React.FC<React.PropsWithChildren<{ className?: string; reduced?: boolean }>> = ({
  children,
  className,
  reduced = false,
}) => {
  const staticMotion = useMotionPrefs();
  if (staticMotion || reduced) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>{children}</motion.div>;
};
