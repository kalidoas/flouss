import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RotateCcw, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { activeToast, clearToast } = useAppStore();

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-2xl border border-slate-700/50 dark:border-slate-200/50 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 max-w-sm w-full mx-4">
      <span className="text-xs font-semibold flex-1 truncate">
        {activeToast.message}
      </span>

      {activeToast.onAction && (
        <button
          onClick={() => {
            activeToast.onAction?.();
            clearToast();
          }}
          className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{activeToast.actionText || 'Annuler'}</span>
        </button>
      )}

      <button
        onClick={clearToast}
        className="p-1 rounded-lg text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
