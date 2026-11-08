import React from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';

interface QuickAddButtonProps {
  onClick: () => void;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({ onClick }) => {
  const language = useAppStore((state) => state.language);
  const label = translations[language].common.quickAdd;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 end-6 z-40 hidden h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:flex"
      aria-label={label}
      title={label}
    >
      <Plus className="h-5 w-5" />
    </button>
  );
};
