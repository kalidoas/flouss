import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';
import { motionDurations, motionEasings } from './tokens';

export interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  yOffset?: number;
  duration?: number;
  children: React.ReactNode;
}

export const Reveal: React.FC<RevealProps> = ({
  delay = 0,
  yOffset = 12,
  duration = motionDurations.base,
  children,
  className = '',
  ...props
}) => {
  const prefersReducedMotion = useMotionPrefs();

  if (prefersReducedMotion) {
    return (
      <div className={className} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{
        duration,
        delay,
        ease: motionEasings.easeOut,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
