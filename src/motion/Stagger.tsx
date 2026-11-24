import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';
import { motionDurations, motionEasings } from './tokens';

export interface StaggerProps extends HTMLMotionProps<'div'> {
  staggerInterval?: number;
  delayChildren?: number;
  children: React.ReactNode;
}

export const Stagger: React.FC<StaggerProps> = ({
  staggerInterval = 0.06,
  delayChildren = 0,
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerInterval,
            delayChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerItemProps extends HTMLMotionProps<'div'> {
  yOffset?: number;
  duration?: number;
  children: React.ReactNode;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
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
      variants={{
        hidden: { opacity: 0, y: yOffset },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration,
            ease: motionEasings.easeOut,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
