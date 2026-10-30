import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: string;
  prefix?: string;
  isAmount?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, suffix, prefix, isAmount, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-medium text-[#787774] dark:text-[#9b9a97] mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-[#787774] dark:text-[#9b9a97] font-medium pointer-events-none select-none text-xs">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-md border transition-colors outline-none
              ${
                isAmount
                  ? 'text-xl font-semibold py-2.5 px-3 tracking-tight'
                  : 'text-sm py-1.5 px-3'
              }
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-14' : ''}
              ${
                error
                  ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                  : 'border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#ecebed] hover:border-[#d3d1cb] dark:hover:border-[#3f3f3f] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2]'
              }
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-2.5 text-[11px] font-medium text-[#787774] dark:text-[#9b9a97] pointer-events-none select-none uppercase tracking-wider bg-[#f1f0ee] dark:bg-[#282828] px-1.5 py-0.5 rounded">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
        {hint && !error && (
          <p className="mt-1 text-xs text-[#787774] dark:text-[#9b9a97]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
