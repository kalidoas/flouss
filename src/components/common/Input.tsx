import React, { useId } from 'react';

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
    const generatedId = useId();
    const inputId = props.id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-medium text-text-subtle uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-text-subtle font-medium pointer-events-none select-none text-xs">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={`w-full min-h-11 rounded-xl border border-border-subtle bg-surface text-content placeholder:text-muted dark:border-border dark:bg-surface-3 dark:text-content dark:placeholder:text-text-subtle transition-all outline-none
              ${
                isAmount
                  ? 'text-xl font-semibold py-2.5 px-3 tracking-tight'
                  : 'text-sm py-2 px-3'
              }
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-14' : ''}
              ${
                error
                  ? 'border-negative/50 bg-negative/10 text-negative0 dark:text-negative focus:border-negative'
                  : 'hover:border-border/20 dark:hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent'
              }
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-2.5 text-[11px] font-medium text-text-subtle pointer-events-none select-none uppercase tracking-wider bg-surface-2 px-1.5 py-0.5 rounded">
              {suffix}
            </div>
          )}
        </div>
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs font-medium text-negative">{error}</p>}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-text-subtle">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
