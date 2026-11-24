import React, { useState, useRef } from 'react';
import { ChevronDown, Check, Tag } from 'lucide-react';
import { Category, Language } from '../../types';
import { getCategoryVisualColor } from '../../utils/categoryColor';
import { getCategoryName } from '../../utils/i18nHelpers';
import { DropdownPortal } from './DropdownPortal';

export interface CategoryOption {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  count?: number;
}

interface GlassCategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string;
  onChange: (categoryId: string) => void;
  language: Language;
  allLabel?: string;
  className?: string;
}

export const GlassCategoryPicker: React.FC<GlassCategoryPickerProps> = ({
  categories,
  selectedCategoryId,
  onChange,
  language,
  allLabel = 'All Categories',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const currentLabel =
    selectedCategoryId === 'all'
      ? allLabel
      : selectedCategory
      ? getCategoryName(selectedCategory, language)
      : allLabel;

  const currentColor =
    selectedCategoryId !== 'all' && selectedCategory
      ? getCategoryVisualColor(selectedCategory.id)
      : undefined;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border-strong bg-bg px-3.5 py-1.5 text-xs font-semibold text-muted outline-none shadow-xs hover:border-border/[0.18] hover:bg-surface-3 focus:ring-2 focus:ring-negative/20 transition-all cursor-pointer"
      >
        {currentColor ? (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: currentColor }}
          />
        ) : (
          <Tag className="w-3.5 h-3.5 text-text-subtle shrink-0" />
        )}
        <span className="truncate max-w-[150px]">{currentLabel}</span>
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
        minWidth={220}
        className="min-w-[220px] overflow-y-auto no-scrollbar rounded-2xl bg-bg/95 backdrop-blur-2xl border border-border/[0.12] p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)]"
      >
        <div className="space-y-0.5">
          {/* "All" Option */}
          <button
            type="button"
            onClick={() => {
              onChange('all');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-surface text-text-subtle font-bold shadow-xs'
                : 'text-muted hover:text-content hover:bg-surface-2'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 opacity-60" />
              <span>{allLabel}</span>
            </div>
            {selectedCategoryId === 'all' && (
              <Check className="w-3.5 h-3.5 text-text-subtle stroke-[2.5]" />
            )}
          </button>

          <div className="h-px bg-surface-2 my-1" />

          {/* Categories list */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const catName = getCategoryName(cat, language);
            const color = getCategoryVisualColor(cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                  isSelected
                    ? 'bg-surface text-text-subtle font-bold shadow-xs'
                    : 'text-muted hover:text-content hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{catName}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-text-subtle stroke-[2.5] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </div>
  );
};
