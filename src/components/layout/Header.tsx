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
  const firstName = (
    account?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    'Khalid'
  )
    .trim()
    .split(/\s+/)[0];
  const now = new Date();
  const greetingTemplate =
    now.getHours() < 12
      ? tDashboard.greetingMorning
      : now.getHours() < 18
      ? tDashboard.greetingAfternoon
      : tDashboard.greetingEvening;
  const greeting = greetingTemplate.replace('{firstName}', firstName);
  const dateLine = new Intl.DateTimeFormat(getIntlLocale(language), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  const shiftMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    const value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    if (value <= currentMonth) setSelectedMonth(value);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
    { code: 'en', label: 'EN' },
  ];

  // Language switcher is strictly hidden on mobile (< md) to avoid header collision
  const languageSwitch = (
    <div
      role="group"
      aria-label={language === 'ar' ? 'اللغة' : language === 'fr' ? 'Langue' : 'Language'}
      className="hidden md:flex relative items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl p-0.5 text-xs"
    >
      {languages.map((item) => {
        const isSelected = language === item.code;
        return (
          <button
            key={item.code}
            type="button"
            aria-pressed={isSelected}
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
            className={`relative flex min-h-8 items-center px-2.5 rounded-full text-[11px] font-semibold transition-all duration-150 z-10 cursor-pointer ${
              isSelected
                ? 'text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isSelected && (
              <motion.span
                layoutId="header-lang-pill"
                className="absolute inset-0 rounded-full bg-white shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
              />
            )}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const privacyButton = (
    <button
      type="button"
      onClick={() => {
        playHapticFeedback('light');
        toggleHideBalance();
      }}
      title={hideBalance ? tCommon.showAmounts : tCommon.hideAmounts}
      aria-label={hideBalance ? tCommon.showAmounts : tCommon.hideAmounts}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer ${
        hideBalance
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  const themeButton = (
    <button
      type="button"
      onClick={() => {
        playHapticFeedback('light');
        toggleTheme();
      }}
      title={isDark ? tCommon.switchToLight : tCommon.switchToDark}
      aria-label={isDark ? tCommon.switchToLight : tCommon.switchToDark}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
    >
      {isDark ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
    </button>
  );

  const monthSwitch = (
    <div
      dir="ltr"
      className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5"
    >
      <button
        type="button"
        onClick={() => shiftMonth(-1)}
        aria-label={tWallet.prevMonth}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[76px] sm:min-w-[100px] px-1 text-center text-[11px] sm:text-xs font-semibold text-zinc-200">
        {formatMonthYear(selectedMonth, language)}
      </span>
      <button
        type="button"
        onClick={() => shiftMonth(1)}
        aria-label={tWallet.nextMonth}
        disabled={selectedMonth >= currentMonth}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4 rotate-180" />
      </button>
    </div>
  );

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#06070A]/90 backdrop-blur-2xl px-3 py-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 lg:px-8"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="mx-auto flex min-h-11 max-w-[1280px] items-center justify-between gap-2 sm:gap-3">
        {/* ── Start Section: Hamburger (always top-left LTR, top-right RTL) + Back Button (only on child views) ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Consistent Hamburger (☰) button for mobile drawer */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('flouss:open-more'))}
            aria-label={tNav.morePages}
            title={tNav.morePages}
            className="flex h-9 w-9 md:hidden shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Back button: Rendered ONLY on child/secondary views (hidden on Dashboard) */}
          {!isDashboard && (
            <button
              type="button"
              onClick={() => {
                playHapticFeedback('light');
                navigateBack();
              }}
              aria-label={tCommon.back}
              title={tCommon.back}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Desktop Greeting (Dashboard only) */}
          {isDashboard && (
            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">{dateLine}</p>
                <h1 className="truncate text-base font-bold tracking-tight bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">
                  {greeting}
                </h1>
              </div>
            </div>
          )}
        </div>

        {/* ── Center Section: Dynamic Island or Month Switcher on Dashboard ── */}
        <div className="flex flex-1 items-center justify-center min-w-0 px-1">
          {isDashboard ? (
            <div className="flex items-center justify-center">
              {monthSwitch}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <DynamicIsland />
            </div>
          )}
        </div>

        {/* ── End Section: Privacy mode, Theme switch & Desktop Language Selector ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          {privacyButton}
          {themeButton}
          {languageSwitch}
          {isDashboard && (
            <div className="hidden lg:block">
              <DynamicIsland />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
