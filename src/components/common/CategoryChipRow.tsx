import React from 'react';
import { Category, IncomeSource, Language } from '../../types';
import { getCategoryName, getIncomeSourceName } from '../../utils/i18nHelpers';
import { getCategoryIcon } from '../../utils/icons';
import { playHapticFeedback } from '../../utils/haptics';

interface CategoryChipRowProps {
  categories?: Category[];
  incomeSources?: IncomeSource[];
  selectedId: string;
  onSelect: (id: string) => void;
  language: Language;
  type?: 'expense' | 'income';
  className?: string;
}

export const CategoryChipRow: React.FC<CategoryChipRowProps> = ({
  categories = [],
  incomeSources = [],
  selectedId,
  onSelect,
  language,
  type = 'expense',
  className = '',
}) => {
  const items = type === 'expense' ? categories : incomeSources;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const label =
            type === 'expense'
              ? getCategoryName(item as Category, language)
              : getIncomeSourceName(item as IncomeSource, language);

          const iconName = (item as Category).icon;
          const IconComp = iconName ? getCategoryIcon(iconName) : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playHapticFeedback('selection');
                onSelect(item.id);
              }}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950 font-bold'
                  : 'bg-surface border border-border-subtle text-muted hover:text-content hover:bg-surface-raised dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10'
              }`}
            >
              {IconComp && (
                <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-inherit' : 'text-accent'}`} />
              )}
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
