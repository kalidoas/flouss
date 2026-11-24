import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';
import { motionSprings } from './tokens';
import { HapticType, playHapticFeedback } from '../utils/haptics';

export interface MotionPressableProps extends Omit<HTMLMotionProps<'button'>, 'scale'> {
  scaleOnPress?: number;
  liftOnHover?: number;
  haptic?: HapticType;
  as?: 'button' | 'div';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Pressable: React.FC<MotionPressableProps> = ({
  scaleOnPress = 0.97,
  liftOnHover = -1.5,
  haptic = 'light',
  as = 'button',
  disabled = false,
  onClick,
  className = '',
  children,
  ...props
}) => {
  const prefersReducedMotion = useMotionPrefs();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (haptic && haptic !== 'none') {
      playHapticFeedback(haptic);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const Component = as === 'div' ? motion.div : motion.button;

  const tapState = prefersReducedMotion || disabled ? undefined : { scale: scaleOnPress };
  const hoverState = prefersReducedMotion || disabled ? undefined : { y: liftOnHover };

  return (
    <Component
      whileTap={tapState}
      whileHover={hoverState}
      transition={motionSprings.default}
      onClick={handleClick as any}
      disabled={disabled}
      aria-disabled={disabled ? 'true' : undefined}
      data-haptic={haptic}
      className={`select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      {...(props as any)}
    >
      {children}
    </Component>
  );
};
