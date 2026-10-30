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
      className={`py-12 px-4 text-center rounded-lg border border-dashed border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1f1f1f] flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      {icon && (
        <div className="w-10 h-10 rounded-md bg-[#f1f0ee] dark:bg-[#282828] text-[#787774] dark:text-[#9b9a97] flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="max-w-xs space-y-1">
        <h4 className="text-sm font-medium text-[#37352f] dark:text-[#ecebed]">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-[#787774] dark:text-[#9b9a97] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};
