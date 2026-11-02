import React from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { HapticType, playHapticFeedback } from '../../utils/haptics';
import { springs } from '../../utils/springs';

export type PressableVariant = 'button' | 'card' | 'tab' | 'pill';

const VARIANT_SCALES: Record<PressableVariant, number> = {
  button: 0.97,
  card: 0.985,
  tab: 0.92,
  pill: 0.95,
};

export interface PressableProps extends Omit<HTMLMotionProps<'button'>, 'scale'> {
  variant?: PressableVariant;
  scale?: number;
  haptic?: HapticType;
  as?: 'button' | 'div';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Pressable: React.FC<PressableProps> = ({
  variant = 'button',
  scale: customScale,
  haptic,
  as = 'button',
  disabled = false,
  onClick,
  className = '',
  children,
  ...restProps
}) => {
  const shouldReduceMotion = useReducedMotion();
  const defaultScale = VARIANT_SCALES[variant] ?? 0.97;
  const targetScale = shouldReduceMotion ? 1 : (customScale ?? defaultScale);

  const defaultHaptic: HapticType =
    variant === 'tab' ? 'selection' : variant === 'card' ? 'selection' : 'light';
  const resolvedHaptic = haptic !== undefined ? haptic : defaultHaptic;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (resolvedHaptic !== 'none') {
      playHapticFeedback(resolvedHaptic);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const Component = as === 'div' ? motion.div : motion.button;

  return (
    <Component
      whileTap={disabled ? undefined : { scale: targetScale }}
      transition={springs.snappy}
      onClick={handleClick as any}
      disabled={disabled}
      aria-disabled={disabled ? 'true' : undefined}
      data-haptic={resolvedHaptic}
      className={`select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      {...(restProps as any)}
    >
      {children}
    </Component>
  );
};
