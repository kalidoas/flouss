import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const variantStyles = {
    default: 'bg-surface border border-border-subtle shadow-sm',
    flat: 'bg-canvas border border-border-subtle',
    bordered:
      'bg-transparent border border-border-subtle hover:border-accent',
  };

  const hoverStyle = hover
    ? 'transition-all duration-150 hover:border-[#d3d1cb] dark:hover:border-[#3f3f3f]'
    : '';

  return (
    <div
      className={`rounded-card ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
