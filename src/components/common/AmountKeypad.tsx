import React from 'react';
import { Delete } from 'lucide-react';
import { playHapticFeedback } from '../../utils/haptics';

interface AmountKeypadProps {
  amount: string;
  onChange: (value: string) => void;
  currency?: string;
  showDisplay?: boolean;
  className?: string;
}

export const AmountKeypad: React.FC<AmountKeypadProps> = ({
  amount,
  onChange,
  currency = 'MAD',
  showDisplay = true,
  className = '',
}) => {
  const handleDigit = (digit: string) => {
    playHapticFeedback('light');

    if (digit === '.') {
      if (!amount) {
        onChange('0.');
        return;
      }
      if (amount.includes('.')) return;
      onChange(`${amount}.`);
      return;
    }

    if (digit === '0') {
      if (amount === '0') return;
      if (!amount) {
        onChange('0');
        return;
      }
    }

    if (amount === '0' && digit !== '.') {
      onChange(digit);
      return;
    }

    // Don't allow more than 2 decimal digits
    if (amount.includes('.')) {
      const parts = amount.split('.');
      if (parts[1]?.length >= 2) return;
    }

    // Limit max amount length
    if (amount.length >= 10) return;

    onChange(`${amount}${digit}`);
  };

  const handleBackspace = () => {
    playHapticFeedback('selection');
    if (!amount) return;
    onChange(amount.slice(0, -1));
  };

  const handleClear = () => {
    playHapticFeedback('medium');
    onChange('');
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Big Bold Amount Display */}
      {showDisplay && (
        <div className="flex items-center justify-between rounded-2xl border border-border-subtle dark:border-white/10 bg-surface dark:bg-white/5 px-4 py-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-content dark:text-white truncate">
              {amount || '0'}
            </span>
            <span className="text-xs font-bold uppercase text-muted tracking-wider">
              {currency}
            </span>
          </div>

          {amount && (
            <button
              type="button"
              onClick={handleClear}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted hover:text-content hover:bg-surface-raised dark:hover:bg-white/10 transition-colors"
              aria-label="Clear amount"
            >
              <Delete className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 3x4 Tactile In-App Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key) => {
          if (key === 'backspace') {
            return (
              <button
                key="backspace"
                type="button"
                onClick={handleBackspace}
                aria-label="Delete last digit"
                className="flex min-h-[48px] items-center justify-center rounded-2xl bg-surface-raised dark:bg-white/5 border border-border-subtle dark:border-white/10 text-content dark:text-white font-bold text-lg hover:bg-surface dark:hover:bg-white/10 active:scale-95 transition-all select-none cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleDigit(key)}
              className="flex min-h-[48px] items-center justify-center rounded-2xl bg-surface dark:bg-white/[0.04] border border-border-subtle dark:border-white/10 text-content dark:text-white font-bold text-xl hover:bg-surface-raised dark:hover:bg-white/[0.08] active:scale-95 transition-all select-none cursor-pointer tabular-nums"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
};
