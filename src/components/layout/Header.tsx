import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Eye, EyeOff, Moon, Sun, ChevronLeft, Menu } from 'lucide-react';
import { DynamicIsland } from './DynamicIsland';
import { Language } from '../../types';
import { translations } from '../../i18n/translations';
import { islandManager } from '../../utils/islandManager';
import { playHapticFeedback } from '../../utils/haptics';
import { useDashboardHeader } from './DashboardHeaderContext';
import { formatMonthYear, getCurrentMonthStr, getIntlLocale } from '../../utils/formatters';

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
    accounts,
    activeAccountId,
    firebaseUser,
  } = useAppStore();
  const { selectedMonth, setSelectedMonth } = useDashboardHeader();

  const isDark =
    theme === 'dark'
      ? true
      : theme === 'light'
      ? false
      : typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const tCommon = translations[language].common;
  const tNav = translations[language].nav;
  const tWallet = translations[language].walletCard;
  const tDashboard = translations[language].dashboard;
  const isDashboard = activeScreen === 'dashboard';
  const currentMonth = getCurrentMonthStr();
  const account = (accounts || []).find((item) => item.id === activeAccountId) || accounts?.[0];
  const firstName = (account?.name || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Khalid').trim().split(/\s+/)[0];
  const now = new Date();
  const greetingTemplate = now.getHours() < 12 ? tDashboard.greetingMorning : now.getHours() < 18 ? tDashboard.greetingAfternoon : tDashboard.greetingEvening;
  const greeting = greetingTemplate.replace('{firstName}', firstName);
  const dateLine = new Intl.DateTimeFormat(getIntlLocale(language), { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  const shiftMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    const value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    if (value <= currentMonth) setSelectedMonth(value);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'عربي' },
    { code: 'en', label: 'EN' },
  ];

  const languageSwitch = (
    <div role="group" aria-label={language === 'ar' ? 'اللغة' : language === 'fr' ? 'Langue' : 'Language'} className="relative flex items-center rounded-control border border-border-subtle bg-surface-raised p-0.5 text-xs">
      {languages.map((item) => {
        const isSelected = language === item.code;
        return <button key={item.code} type="button" aria-pressed={isSelected} onClick={() => {
          setLanguage(item.code);
          islandManager.notify({ type: 'lang', title: item.code === 'ar' ? 'تم تغيير اللغة إلى العربية' : item.code === 'en' ? 'Switched to English' : 'Passé en français', subtitle: item.label });
        }} className={`relative flex min-h-11 items-center px-2 rounded-control text-[10px] sm:text-xs font-semibold transition-colors duration-150 z-10 ${isSelected ? 'text-zinc-900 dark:text-white font-bold' : 'text-muted hover:text-content'}`}>
          {isSelected && <motion.span layoutId="header-lang-pill" className="absolute inset-0 rounded-control bg-surface shadow-xs -z-10" transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }} />}
          <span>{item.label}</span>
        </button>;
      })}
    </div>
  );

  const privacyButton = (
    <button type="button" onClick={() => { playHapticFeedback('light'); toggleHideBalance(); }} title={hideBalance ? tCommon.showAmounts : tCommon.hideAmounts} aria-label={hideBalance ? tCommon.showAmounts : tCommon.hideAmounts} className={`flex min-h-11 min-w-11 items-center justify-center rounded-control border px-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] ${hideBalance ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' : 'border-transparent text-muted hover:bg-surface-raised hover:text-content'}`}>
      {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  const themeButton = (
    <button type="button" onClick={() => { playHapticFeedback('light'); toggleTheme(); }} title={isDark ? tCommon.switchToLight : tCommon.switchToDark} aria-label={isDark ? tCommon.switchToLight : tCommon.switchToDark} className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]">
      {isDark ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
    </button>
  );

  const monthSwitch = (
    <div dir="ltr" className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-control border border-border-subtle bg-surface-raised p-0.5 lg:h-11">
      <button type="button" onClick={() => shiftMonth(-1)} aria-label={tWallet.prevMonth} className="flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] lg:h-10 lg:w-10"><ChevronLeft className="h-4 w-4" /></button>
      <span className="min-w-[88px] px-1 text-center text-[11px] font-semibold text-content lg:min-w-[116px] lg:text-xs">{formatMonthYear(selectedMonth, language)}</span>
      <button type="button" onClick={() => shiftMonth(1)} aria-label={tWallet.nextMonth} disabled={selectedMonth >= currentMonth} className="flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-surface disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] lg:h-10 lg:w-10"><ChevronLeft className="h-4 w-4 rotate-180" /></button>
    </div>
  );

  if (isDashboard) {
    return <header className="sticky top-0 z-30 border-b border-border-subtle bg-canvas/90 px-2.5 py-2 backdrop-blur-xl sm:px-4 lg:px-10">
      <div className="mx-auto flex min-h-12 max-w-[1160px] items-center justify-between gap-3">
        <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => { playHapticFeedback('light'); navigateBack(); }}
            aria-label={tCommon.back}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
          >
            <ChevronLeft className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="min-w-0">
            <p className="text-xs capitalize text-muted">{dateLine}</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-[#F5F5F7]">{greeting}</h1>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {monthSwitch}{privacyButton}{languageSwitch}{themeButton}<DynamicIsland />
        </div>
        <div className="flex w-full items-center justify-between gap-2 lg:hidden">
          <button type="button" onClick={() => { playHapticFeedback('light'); navigateBack(); }} aria-label={tCommon.back} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]"><ChevronLeft className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''}`} /></button>
          {monthSwitch}{privacyButton}
          <button type="button" onClick={() => window.dispatchEvent(new Event('flouss:open-more'))} aria-label={tNav.morePages} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
    </header>;
  }

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
