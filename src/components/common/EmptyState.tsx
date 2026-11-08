import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`min-w-0 py-4 px-3 sm:px-4 rounded-card border border-dashed border-border-subtle bg-surface flex flex-col sm:flex-row sm:items-center gap-3 ${className}`}
    >
      {icon && (
        <div className="w-9 h-9 rounded-control bg-surface-raised text-muted flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <h4 className="text-sm font-medium text-content">{title}</h4>
        {description && <p className="text-xs text-muted leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0 self-end sm:self-auto">{action}</div>}
    </div>
  );
};
