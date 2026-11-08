import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, className = '' }) => (
  <header className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-content">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

export interface ListRowProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListRow: React.FC<ListRowProps> = ({
  leading,
  title,
  description,
  trailing,
  onClick,
  className = '',
}) => {
  const content = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-sm font-medium text-content">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </>
  );

  const classes = `flex min-h-11 w-full items-center gap-3 rounded-control border border-border-subtle bg-surface px-3 py-2 ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${classes} text-start hover:bg-surface-raised`}>
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'text' | 'rectangle' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ shape = 'text', className = '', ...props }) => {
  const shapeClass = {
    text: 'h-4 rounded-control',
    rectangle: 'rounded-card',
    circle: 'aspect-square rounded-full',
  }[shape];

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-surface-raised ${shapeClass} ${className}`}
      {...props}
    />
  );
};
