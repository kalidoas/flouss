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
    'inline-flex min-h-11 items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-95 transition-all duration-300 rounded-full cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 rounded-full gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-full gap-2 font-medium',
    lg: 'text-sm px-6 py-3 rounded-full gap-2.5 font-semibold',
    xl: 'text-base px-7 py-3.5 rounded-full gap-3 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-bg text-content hover:bg-surface shadow-sm dark:bg-surface dark:text-text-subtle dark:hover:bg-surface-2 dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] font-semibold border border-transparent',
    secondary:
      'bg-surface-raised hover:bg-surface text-content border border-border-subtle dark:bg-surface-3 dark:hover:bg-surface-2 dark:text-muted dark:border-border backdrop-blur-xl',
    income:
      'bg-positive/10 text-positive dark:text-positive hover:bg-positive/20 border border-positive/25',
    danger:
      'bg-negative/10 text-negative dark:text-negative hover:bg-negative/20 border border-negative/25',
    outline:
      'bg-transparent hover:bg-surface-raised text-content border border-border-subtle dark:bg-surface-3 dark:hover:bg-surface-2 dark:text-muted dark:border-border',
    ghost:
      'bg-transparent hover:bg-surface-raised text-muted hover:text-content dark:hover:bg-surface-2 dark:text-text-subtle dark:hover:text-content',
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
