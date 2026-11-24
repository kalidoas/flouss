import React, { useState, useRef } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { DropdownPortal } from './DropdownPortal';

export interface MonthOption {
  value: string;
  label: string;
}

interface GlassMonthPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: MonthOption[];
  ariaLabel?: string;
  className?: string;
}

export const GlassMonthPicker: React.FC<GlassMonthPickerProps> = ({
  value,
  onChange,
  options,
  ariaLabel = 'Select Month',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border-strong bg-bg px-3.5 py-1.5 text-xs font-semibold text-muted outline-none shadow-xs hover:border-border/[0.18] hover:bg-surface-3 focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer"
      >
        <Calendar className="w-3.5 h-3.5 text-text-subtle shrink-0" />
        <span className="truncate max-w-[140px]">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-subtle shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-content' : ''
          }`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        align="end"
        minWidth={210}
        className="min-w-[210px] overflow-y-auto no-scrollbar rounded-2xl bg-bg/95 backdrop-blur-2xl border border-border/[0.12] p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)]"
      >
        <div className="space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                  isSelected
                    ? 'bg-surface text-text-subtle font-bold shadow-xs'
                    : 'text-muted hover:text-content hover:bg-surface-2'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-text-subtle stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </div>
  );
};
