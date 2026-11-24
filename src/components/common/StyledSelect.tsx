import React, { useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { DropdownPortal } from './DropdownPortal';

export interface StyledSelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  options,
  onChange,
  label,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3.5 py-1.5 text-start text-xs text-muted outline-none hover:bg-surface/90 hover:border-border-strong hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300 cursor-pointer shadow-xs"
      >
        <span className="truncate">{selected?.label || label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text-subtle transition-transform duration-200 ${
            open ? 'rotate-180 text-content' : ''
          }`}
        />
      </button>

      <DropdownPortal
        isOpen={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        matchTriggerWidth={true}
        minWidth={160}
        offsetY={4}
        className="overflow-y-auto no-scrollbar rounded-xl bg-bg border border-border p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      >
        <div role="listbox" aria-label={label} className="space-y-0.5">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-8 w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-start text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-surface text-text-subtle font-bold shadow-xs'
                    : 'text-muted hover:text-content hover:bg-surface-2'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-text-subtle stroke-[2.5] shrink-0" />}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </div>
  );
};
