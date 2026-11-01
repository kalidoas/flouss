import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Eye, EyeOff, Moon, Sun, Globe } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Language } from '../../types';

export const Header: React.FC = () => {
  const {
    hideBalance,
    toggleHideBalance,
    theme,
    setTheme,
    language,
    setLanguage,
    activeScreen,
    accounts,
    activeAccountId,
  } = useAppStore();

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'عربي' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/75 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 sm:px-6 py-2.5 flex items-center justify-between transition-colors duration-200">
      {/* Brand logo on mobile */}
      <div className="flex md:hidden items-center">
        <Logo size="sm" showWordmark={true} />
      </div>

      {/* Desktop breadcrumb showing Workspace & Active Account context */}
      <div className="hidden md:flex items-center gap-2 text-xs text-[#787774] dark:text-[#9b9a97]">
        <span className="font-semibold text-[#37352f] dark:text-white tracking-tight">Flouss</span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        {activeAccount && (
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-xs"
              style={{ backgroundColor: activeAccount.avatarColor || '#2383e2' }}
            >
              {activeAccount.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium truncate max-w-[140px]">{activeAccount.name}</span>
          </div>
        )}
      </div>

      {/* Header Controls: Language Selector, Privacy mode toggle & Theme toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Apple Segmented Language Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] text-xs">
          {languages.map((item) => (
            <button
              key={item.code}
              onClick={() => setLanguage(item.code)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                language === item.code
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Toggle hide balance with keyboard hint */}
        <button
          onClick={toggleHideBalance}
          title={hideBalance ? 'Afficher les montants (H)' : 'Masquer les montants (H)'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal transition-all duration-150 border ${
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
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Changer de thème"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
};
