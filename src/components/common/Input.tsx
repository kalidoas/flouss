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
          <label htmlFor={inputId} className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-zinc-400 font-medium pointer-events-none select-none text-xs">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={`w-full min-h-11 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 transition-all outline-none
              ${
                isAmount
                  ? 'text-xl font-semibold py-2.5 px-3 tracking-tight'
                  : 'text-sm py-2 px-3'
              }
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-14' : ''}
              ${
                error
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 focus:border-rose-500'
                  : 'hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
              }
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-2.5 text-[11px] font-medium text-zinc-400 pointer-events-none select-none uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded">
              {suffix}
            </div>
          )}
        </div>
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs font-medium text-rose-400">{error}</p>}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-zinc-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
