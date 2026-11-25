import React from 'react';
import { useAppStore } from '../../store/useAppStore';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const language = useAppStore((s) => s.language);

  const sizeMap = {
    sm: {
      box: 'w-6 h-6 rounded-xl',
      svg: 'w-3.5 h-3.5',
      text: 'text-sm',
    },
    md: {
      box: 'w-7 h-7 rounded-xl',
      svg: 'w-4 h-4',
      text: 'text-sm font-bold',
    },
    lg: {
      box: 'w-9 h-9 rounded-2xl',
      svg: 'w-5 h-5',
      text: 'text-lg font-bold',
    },
  };

  const s = sizeMap[size];
  const titleText = language === 'ar' ? 'فلوس' : 'Flouss';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Neutral coin/ring mark */}
      <div className={`${s.box} bg-surface border border-border dark:bg-surface-2 dark:border-border text-accent dark:text-accent flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.svg}>
          <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10 -4.477 10 -10 10S2 17.523 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2C7.586 2 4 5.586 4 10S7.586 18 12 18 20 14.414 20 10 16.414 2 12 2Z" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      </div>

      {/* Dynamic Locale Wordmark */}
      {showWordmark && (
        <div className="flex items-center leading-none">
          <span className={`font-bold ${s.text} text-content dark:text-content`}>
            {titleText}
          </span>
        </div>
      )}
    </div>
  );
};