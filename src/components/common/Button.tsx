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
    'inline-flex items-center justify-center font-medium transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-md gap-2 font-medium',
    lg: 'text-sm px-4 py-2.5 rounded-md gap-2.5 font-medium',
    xl: 'text-base px-5 py-3 rounded-md gap-3 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-[#2383e2] hover:bg-[#1a73cb] text-white shadow-sm border border-[#2383e2]',
    secondary:
      'bg-white dark:bg-[#252525] hover:bg-[#f1f0ee] dark:hover:bg-[#2e2e2e] text-[#37352f] dark:text-[#ecebed] border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm',
    income:
      'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60',
    danger:
      'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60',
    outline:
      'bg-transparent hover:bg-[#f1f0ee] dark:hover:bg-[#252525] text-[#37352f] dark:text-[#ecebed] border border-[#e3e2de] dark:border-[#2f2f2f]',
    ghost:
      'bg-transparent hover:bg-[#f1f0ee] dark:hover:bg-[#252525] text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed]',
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
