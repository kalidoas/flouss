import React from 'react';
import { motion } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';

export interface SkeletonShimmerProps {
  className?: string;
  rounded?: string;
  width?: string | number;
  height?: string | number;
}

export const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({
  className = '',
  rounded = 'rounded-xl',
  width,
  height,
}) => {
  const prefersReducedMotion = useMotionPrefs();

  return (
    <div
      className={`relative overflow-hidden bg-muted/40 dark:bg-white/[0.06] ${rounded} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      {!prefersReducedMotion ? (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.12] dark:via-white/[0.08] to-transparent pointer-events-none"
          animate={{
            translateX: ['-100%', '100%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-muted/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};
