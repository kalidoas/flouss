import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Language } from '../../types';
import { islandManager } from '../../utils/islandManager';
import { translations } from '../../i18n/translations';
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
  } = useAppStore();

  const isDark =
    theme === 'dark'
      ? true
      : theme === 'light'
      ? false
      : typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const tNav = translations[language].nav;

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'عربي' },
    { code: 'en', label: 'EN' },
  ];

  const screenName = (tNav as any)[activeScreen] || activeScreen;
  const brandName = language === 'ar' ? 'فلوس' : 'Flouss';

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/75 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 sm:px-6 py-2.5 flex items-center justify-between transition-colors duration-200">
      {/* Brand logo on mobile */}
      <div className="flex md:hidden items-center">
        <Logo size="sm" showWordmark={true} />
      </div>

      {/* Desktop breadcrumb showing Workspace context (Clean, no duplicate user pill) */}
      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-bold text-zinc-900 dark:text-white tracking-tight">{brandName}</span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">
          {screenName}
        </span>
      </div>

      {/* Header Controls: Language Selector, Privacy mode toggle & Theme toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Apple Sliding Segmented Language Switcher with layoutId */}
        <div className="relative flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] text-xs">
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
                className={`relative px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors duration-150 z-10 ${
                  isSelected
                    ? 'text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="header-lang-pill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-xs -z-10"
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
          title={hideBalance ? 'Afficher les montants (H)' : 'Masquer les montants (H)'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-normal transition-all duration-150 border ${
            hideBalance
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
          }`}
          aria-label="Toggle privacy"
        >
          {hideBalance ? (
            <EyeOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline text-[10px] font-mono opacity-60">H</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => {
            playHapticFeedback('light');
            toggleTheme();
          }}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
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
