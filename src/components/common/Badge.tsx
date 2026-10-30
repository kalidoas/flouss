import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  icon,
}) => {
  const variantStyles = {
    emerald:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
    amber:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
    rose:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40',
    blue:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
    purple:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
    slate:
      'bg-[#f1f0ee] text-[#5f5e5b] dark:bg-[#282828] dark:text-[#9b9a97] border-[#e3e2de] dark:border-[#2f2f2f]',
  };

  const sizeStyles = {
    sm: 'text-[11px] font-medium px-1.5 py-0.5 rounded',
    md: 'text-xs font-medium px-2 py-0.5 rounded',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
