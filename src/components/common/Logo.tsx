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
      box: 'w-6 h-6 rounded-lg',
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
      {/* Apple-style translucent icon badge */}
      <div
        className={`${s.box} bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs flex items-center justify-center shrink-0 font-bold`}
      >
        <span className="text-xs font-mono">F</span>
      </div>

      {/* Dynamic Locale Wordmark */}
      {showWordmark && (
        <div className="flex items-center leading-none">
          <span
            className={`font-bold ${s.text} text-zinc-900 dark:text-white tracking-tight`}
          >
            {titleText}
          </span>
        </div>
      )}
    </div>
  );
};
