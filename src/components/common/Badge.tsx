import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  icon,
  className = '',
}) => {
  const variantStyles = {
    emerald:
      'bg-positive text-positive dark:bg-positive/40 dark:text-positive border-positive/60 dark:border-positive/40',
    amber:
      'bg-warning text-warning dark:bg-warning/40 dark:text-warning border-warning/60 dark:border-warning/40',
    rose:
      'bg-negative text-negative dark:bg-negative/40 dark:text-negative border-negative/60 dark:border-negative/40',
    blue:
      'bg-info text-info dark:bg-info/40 dark:text-info border-info/60 dark:border-info/40',
    purple:
      'bg-accent text-accent dark:bg-accent/40 dark:text-accent border-accent/60 dark:border-accent/40',
    slate:
      'bg-surface-3 text-muted dark:bg-surface-3 text-muted border-border',
  };

  const sizeStyles = {
    sm: 'text-xs font-medium px-2 py-1 rounded-full',
    md: 'text-sm font-medium px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1 border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const Chip = Badge;
