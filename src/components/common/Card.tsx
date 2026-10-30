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
    default:
      'bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm',
    flat: 'bg-[#f7f6f3] dark:bg-[#1f1f1f] border border-[#e3e2de] dark:border-[#2f2f2f]',
    bordered:
      'bg-transparent border border-[#e3e2de] dark:border-[#2f2f2f] hover:border-[#d3d1cb] dark:hover:border-[#3f3f3f]',
  };

  const hoverStyle = hover
    ? 'transition-all duration-150 hover:border-[#d3d1cb] dark:hover:border-[#3f3f3f]'
    : '';

  return (
    <div
      className={`rounded-lg ${variantStyles[variant === 'gradient' as any ? 'default' : variant]} ${paddingStyles[padding]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
