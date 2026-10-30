import React from 'react';

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
  const sizeMap = {
    sm: {
      box: 'w-6 h-6 rounded',
      svg: 'w-3.5 h-3.5',
      text: 'text-sm',
      arabic: 'text-[10px]',
    },
    md: {
      box: 'w-7 h-7 rounded-md',
      svg: 'w-4 h-4',
      text: 'text-sm',
      arabic: 'text-[11px]',
    },
    lg: {
      box: 'w-9 h-9 rounded-md',
      svg: 'w-5 h-5',
      text: 'text-lg',
      arabic: 'text-xs',
    },
  };

  const s = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Notion-style minimal icon box */}
      <div
        className={`${s.box} bg-[#37352f] text-white dark:bg-[#ecebed] dark:text-[#191919] flex items-center justify-center shrink-0 font-bold`}
      >
        <span className="text-xs font-mono">F</span>
      </div>

      {/* Wordmark & Arabic subtitle */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-semibold ${s.text} text-[#37352f] dark:text-[#ecebed] tracking-tight`}
          >
            Flouss
          </span>
          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-normal">
            فلوس
          </span>
        </div>
      )}
    </div>
  );
};
