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
      'bg-white text-zinc-950 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-zinc-100 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-transparent',
    secondary:
      'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 backdrop-blur-xl hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    income:
      'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    danger:
      'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/25 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    outline:
      'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 backdrop-blur-xl hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    ghost:
      'bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white',
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
