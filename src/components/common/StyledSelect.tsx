import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface StyledSelectOption { value: string; label: string; }
interface StyledSelectProps {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export const StyledSelect: React.FC<StyledSelectProps> = ({ value, options, onChange, label, className = '' }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <div className={`relative ${className}`}>
      <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-control border border-border-subtle bg-surface px-3 text-start text-xs text-content outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <span className="truncate">{selected?.label || label}</span><ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </button>
      {open && <>
        <button type="button" aria-label="Close options" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
        <div role="listbox" aria-label={label} className="absolute end-0 top-full z-50 mt-1 max-h-64 min-w-full overflow-y-auto rounded-card border border-border-subtle bg-surface p-1 shadow-lg">
          {options.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value}
            onClick={() => { onChange(option.value); setOpen(false); }}
            className={`flex min-h-10 w-full items-center rounded-control px-3 text-start text-xs hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${option.value === value ? 'text-accent' : 'text-content'}`}>
            <span className="truncate">{option.label}</span>
          </button>)}
        </div>
      </>}
    </div>
  );
};
