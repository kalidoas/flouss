import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Eye, EyeOff, Moon, Sun, ChevronLeft, Menu } from 'lucide-react';
import { DynamicIsland } from './DynamicIsland';
import { Language } from '../../types';
import { translations } from '../../i18n/translations';
import { islandManager } from '../../utils/islandManager';
import { playHapticFeedback } from '../../utils/haptics';

export const Header: React.FC = () => {
  const {
    hideBalance,
    toggleHideBalance,
    theme,
    isDarkMode,
    toggleTheme,
    language,
    setLanguage,
    activeScreen,
    navigateBack,
  } = useAppStore();

  const isDark =
    theme === 'dark'
      ? true
      : theme === 'light'
      ? false
      : typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const tCommon = translations[language].common;
  const tNav = translations[language].nav;

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'عربي' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-1.5 border-b border-border-subtle bg-surface/90 px-2.5 py-2 backdrop-blur-xl sm:gap-3 sm:px-4">
      <div className="flex min-w-0 shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('flouss:open-more'))}
          aria-label={tNav.morePages}
          title={tNav.morePages}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:bg-surface-raised md:hidden"
        ><Menu className="h-5 w-5" strokeWidth={2} /></button>
        {activeScreen !== 'dashboard' && (
          <button
            onClick={() => {
              playHapticFeedback('light');
              navigateBack();
            }}
            aria-label={tCommon.back}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-raised hover:text-content"
          >
            <ChevronLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Streamlined Center Island Activity & Cloud Sync Status */}
      <div className="flex min-w-0 flex-1 items-center justify-center px-0.5">
        <DynamicIsland />
      </div>

      {/* Header Controls: Language Selector, Privacy mode toggle & Theme toggle */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        {/* Apple Sliding Segmented Language Switcher with layoutId */}
        <div className="relative flex items-center rounded-control border border-border-subtle bg-surface-raised p-0.5 text-xs">
          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => {
                  setLanguage(item.code);
                  islandManager.notify({
                    type: 'lang',
                    title:
                      item.code === 'ar'
                        ? 'تم تغيير اللغة إلى العربية'
                        : item.code === 'en'
                        ? 'Switched to English'
                        : 'Passé en français',
                    subtitle: item.label,
                  });
                }}
                className={`relative min-h-11 px-1.5 sm:px-2 rounded-control text-[10px] sm:text-xs font-semibold transition-colors duration-150 z-10 ${
                  isSelected
                    ? 'text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="header-lang-pill"
                    className="absolute inset-0 rounded-control bg-surface shadow-xs -z-10"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 32,
                      mass: 0.8,
                    }}
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle hide balance with keyboard hint */}
        <button
          onClick={() => {
            playHapticFeedback('light');
            toggleHideBalance();
          }}
          title={hideBalance ? tCommon.showAmounts : tCommon.hideAmounts}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-control border px-2 text-xs font-normal transition-all duration-150 ${
            hideBalance
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
          }`}
          aria-label={hideBalance ? tCommon.showAmounts : tCommon.hideAmounts}
        >
          {hideBalance ? (
            <EyeOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => {
            playHapticFeedback('light');
            toggleTheme();
          }}
          title={isDark ? tCommon.switchToLight : tCommon.switchToDark}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-raised hover:text-content"
          aria-label={isDark ? tCommon.switchToLight : tCommon.switchToDark}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          )}
        </button>
      </div>
    </header>
  );
};
