import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'income';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex min-h-11 items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

  const sizeStyles = {
    sm: 'text-caption px-3 py-2 rounded-control gap-1.5',
    md: 'text-body px-4 py-3 rounded-control gap-2 font-medium',
    lg: 'text-body px-4 py-3 rounded-control gap-3 font-medium',
    xl: 'text-strong px-6 py-4 rounded-control gap-3 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-accent hover:brightness-95 text-white shadow-sm border border-accent',
    secondary:
      'bg-surface hover:bg-surface-raised text-content border border-border-subtle shadow-sm',
    income:
      'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60',
    danger:
      'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60',
    outline:
      'bg-transparent hover:bg-surface-raised text-content border border-border-subtle',
    ghost:
      'bg-transparent hover:bg-surface-raised text-muted hover:text-content',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
