import React from 'react';

export interface IndicatorProps { value: number; max?: number; label: string; className?: string; }
export const Indicator: React.FC<IndicatorProps> = ({ value, max = 100, label, className = '' }) => {
  const safeMax = Math.max(1, max);
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return <div className={className} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={Math.min(safeMax, Math.max(0, value))}>
    <div className="h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full w-full rounded-full bg-accent-500 transition-transform duration-320" style={{ transform: `scaleX(${percent / 100})`, transformOrigin: 'left center' }} /></div>
  </div>;
};
