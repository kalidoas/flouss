import React from 'react';
import { motion, type SVGMotionProps } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';
import { motionDurations, motionEasings } from './tokens';

export interface DrawPathProps extends Omit<SVGMotionProps<SVGPathElement>, 'className'> {
  d: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export const DrawPath: React.FC<DrawPathProps> = ({
  d,
  duration = motionDurations.slow,
  delay = 0.1,
  className = '',
  ...props
}) => {
  const prefersReducedMotion = useMotionPrefs();

  if (prefersReducedMotion) {
    return (
      <path
        d={d}
        className={className}
        {...(props as React.SVGAttributes<SVGPathElement>)}
      />
    );
  }

  return (
    <motion.path
      d={d}
      className={className}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: {
          duration,
          delay,
          ease: motionEasings.easeOut,
        },
        opacity: {
          duration: motionDurations.fast,
          delay,
        },
      }}
      {...props}
    />
  );
};
