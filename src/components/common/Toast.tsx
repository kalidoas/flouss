import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RotateCcw, X } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast: React.FC = () => {
  const { activeToast, clearToast, language } = useAppStore();

  // Strict 4,000ms auto-dismiss timer on every toast
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 4000);

    return () => clearTimeout(timer);
  }, [activeToast, clearToast]);

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          key="global-toast"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface text-content border border-border-subtle shadow-lg dark:bg-bg/95 dark:text-content dark:border-border/[0.12] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl max-w-sm w-[calc(100%-2rem)]"
        >
          <span className="text-xs font-semibold flex-1 truncate text-content dark:text-content">
            {activeToast.message}
          </span>

          {activeToast.onAction && (
            <button
              onClick={() => {
                activeToast.onAction?.();
                clearToast();
              }}
              className="min-h-8 px-2.5 rounded-full bg-content text-canvas dark:bg-surface dark:text-text-subtle font-bold text-xs flex items-center gap-1.5 shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{activeToast.actionText || translations[language].common.undo}</span>
            </button>
          )}

          <button
            onClick={clearToast}
            aria-label={translations[language].common.close}
            className="p-1 rounded-lg text-muted hover:text-content dark:text-text-subtle dark:hover:text-content transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
