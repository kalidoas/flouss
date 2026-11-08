import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RotateCcw, X } from 'lucide-react';
import { translations } from '../../i18n/translations';

export const Toast: React.FC = () => {
  const { activeToast, clearToast, language } = useAppStore();

  if (!activeToast) return null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-card bg-surface-raised text-content shadow-lg border border-border-subtle animate-in slide-in-from-bottom-5 duration-200 max-w-sm w-[calc(100%-2rem)]">
      <span className="text-xs font-semibold flex-1 truncate">
        {activeToast.message}
      </span>

      {activeToast.onAction && (
        <button
          onClick={() => {
            activeToast.onAction?.();
            clearToast();
          }}
          className="min-h-11 px-3 rounded-control bg-accent hover:brightness-95 text-white font-semibold text-xs flex items-center gap-1 shrink-0 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{activeToast.actionText || translations[language].common.undo}</span>
        </button>
      )}

      <button
        onClick={clearToast}
        aria-label={translations[language].common.close}
        className="p-1 rounded-lg text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
