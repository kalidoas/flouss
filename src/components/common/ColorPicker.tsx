import React from 'react';
import { COLOR_OPTIONS } from '../../utils/icons';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (colorHex: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2.5 p-1">
      {COLOR_OPTIONS.map((c) => {
        const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
        return (
          <button
            key={c.hex}
            type="button"
            title={c.label}
            onClick={() => onSelect(c.hex)}
            style={{ backgroundColor: c.hex }}
            className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center text-content shadow-sm ${
              isSelected
                ? 'scale-110 ring-2 ring-offset-2 ring-positive dark:ring-offset-text-content'
                : 'hover:scale-105'
            }`}
          >
            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
          </button>
        );
      })}
    </div>
  );
};
