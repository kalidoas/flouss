import React, { useState } from 'react';
import { ICON_OPTIONS } from '../../utils/icons';
import { Search } from 'lucide-react';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = ICON_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une icône..."
          className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-2xl">
        {filtered.map((item) => {
          const IconComp = item.icon;
          const isSelected = selectedIcon === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelect(item.name)}
              title={item.label}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <IconComp className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
