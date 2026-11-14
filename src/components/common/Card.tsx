import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  spotlight?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = true,
  spotlight = true,
  className = '',
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const variantStyles = {
    default:
      'relative overflow-hidden bg-surface text-content border border-border-subtle shadow-xs dark:bg-white/5 dark:text-white dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl',
    flat: 'relative overflow-hidden bg-surface text-content border border-border-subtle dark:bg-white/5 dark:text-white dark:border-white/10 backdrop-blur-xl',
    bordered:
      'relative overflow-hidden bg-surface text-content border border-border-subtle hover:border-accent/40 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:border-indigo-500/40 backdrop-blur-xl',
  };

  const hoverStyle = hover
    ? 'transition-all duration-300 hover:border-black/15 hover:shadow-md dark:hover:border-white/20 dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]'
    : 'transition-all duration-300';

  const spotlightStyle = spotlight || hover
    ? 'spotlight-card after:absolute after:inset-x-8 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-indigo-400/60 after:to-transparent after:pointer-events-none'
    : '';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (spotlight || hover) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      e.currentTarget.style.setProperty('--x', `${x}px`);
      e.currentTarget.style.setProperty('--y', `${y}px`);
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (spotlight || hover) {
      e.currentTarget.style.setProperty('--x', '-9999px');
      e.currentTarget.style.setProperty('--y', '-9999px');
    }
    onMouseLeave?.(e);
  };

  return (
    <div
      data-spotlight={spotlight || hover ? 'true' : undefined}
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyle} ${spotlightStyle} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};
