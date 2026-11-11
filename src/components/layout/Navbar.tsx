import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ScreenId } from '../../types';
import { translations } from '../../i18n/translations';
import { playHapticFeedback, triggerHaptic } from '../../utils/haptics';
import { UserProfileModal } from '../profile/UserProfileModal';
import { BottomSheet } from '../common/BottomSheet';
import {
  LayoutDashboard, TrendingDown, Plus, CheckSquare, BarChart3, Layers,
  TrendingUp, History, Settings, FileText, HandCoins, CreditCard, LogOut, User, Moon, Sun,
} from 'lucide-react';
import { DynamicIsland } from './DynamicIsland';
import { Language } from '../../types';

interface NavbarProps {
  onQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickAdd }) => {
  const { activeScreen, setActiveScreen, language, setLanguage, logout, accounts, activeAccountId, firebaseUser, isDarkMode, toggleTheme } = useAppStore();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOmniFabOpen, setIsOmniFabOpen] = useState(false);
  const t = translations[language].nav;
  const tCommon = translations[language].common;
  const isAr = language === 'ar';

  useEffect(() => {
    const openMore = () => setIsMoreMenuOpen(true);
    window.addEventListener('flouss:open-more', openMore);
    return () => window.removeEventListener('flouss:open-more', openMore);
  }, []);

  const activeAccount = (accounts || []).find((account) => account.id === activeAccountId)
    || (accounts || [])[0]
    || (firebaseUser ? { id: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email || '', avatarColor: '#2383e2' } : null);

  const items: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: language === 'ar' ? 'الرئيسية' : language === 'fr' ? 'Accueil' : 'Home', icon: LayoutDashboard },
    { id: 'expenses', label: t.expenses, icon: TrendingDown },
    { id: 'stats', label: t.stats, icon: BarChart3 },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
  ];
  const moreScreens: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'categories', label: t.categories, icon: Layers },
    { id: 'income', label: t.income, icon: TrendingUp },
    { id: 'history', label: t.history, icon: History },
    { id: 'notes', label: t.notes, icon: FileText },
    { id: 'debts', label: t.debts, icon: HandCoins },
    { id: 'subscriptions', label: t.subscriptions, icon: CreditCard },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <>
      <nav aria-label={language === 'ar' ? 'التنقل الرئيسي' : language === 'fr' ? 'Navigation principale' : 'Main navigation'} className="md:hidden fixed bottom-0 inset-x-0 z-[100] mx-3 mb-3 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-center rounded-full bg-[#0D0E14]/85 backdrop-blur-2xl border border-white/10 shadow-2xl px-2 py-1.5">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const selected = activeScreen === item.id;
          return (
            <button key={item.id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => { playHapticFeedback('light'); setActiveScreen(item.id); }} className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-colors ${selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Icon className={`h-5 w-5 transition-transform ${selected ? 'text-indigo-400 scale-110' : ''}`} />
              <span className="max-w-full truncate text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
        {/* Glowing Omni-Action Center FAB */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(50);
            setIsOmniFabOpen((prev) => !prev);
          }}
          aria-expanded={isOmniFabOpen}
          aria-label={translations[language].common.quickAdd}
          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full font-semibold transition-all duration-300 active:scale-95 ${
            isOmniFabOpen
              ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.6)] rotate-45'
              : 'bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]'
          }`}
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </button>
        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const selected = activeScreen === item.id;
          return (
            <button key={item.id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => { playHapticFeedback('light'); setActiveScreen(item.id); }} className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-colors ${selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Icon className={`h-5 w-5 transition-transform ${selected ? 'text-indigo-400 scale-110' : ''}`} />
              <span className="max-w-full truncate text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
        </div>
      </nav>

      {/* Omni-Action FAB Expanded Overlay Menu */}
      <AnimatePresence>
        {isOmniFabOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOmniFabOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95]"
            />

            {/* Omni Action Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-[105] w-[calc(100vw-2rem)] max-w-sm rounded-[28px] bg-[#0D0E14]/95 backdrop-blur-2xl border border-white/10 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            >
              <div className="grid grid-cols-2 gap-2.5">
                {/* Action 1: Add Expense */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(50);
                    setIsOmniFabOpen(false);
                    window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'expense' } }));
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-rose-500/15 border border-white/[0.06] hover:border-rose-500/30 text-start transition-all active:scale-95 duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-rose-300 truncate">
                      {tCommon.addExpense}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'مصروف جديد' : 'Nouvelle dépense'}
                    </span>
                  </div>
                </button>

                {/* Action 2: Add Income */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(50);
                    setIsOmniFabOpen(false);
                    window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'income' } }));
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-500/30 text-start transition-all active:scale-95 duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-emerald-300 truncate">
                      {tCommon.addIncome}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'دخل أو إيداع' : 'Entrée de fonds'}
                    </span>
                  </div>
                </button>

                {/* Action 3: New Task */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(50);
                    setIsOmniFabOpen(false);
                    setActiveScreen('tasks');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('flouss:open-add-task'));
                    }, 60);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-indigo-500/15 border border-white/[0.06] hover:border-indigo-500/30 text-start transition-all active:scale-95 duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-indigo-300 truncate">
                      {translations[language].tasks.addTask}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'مهمة أو عادة' : 'Tâche ou habitude'}
                    </span>
                  </div>
                </button>

                {/* Action 4: New Note */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(50);
                    setIsOmniFabOpen(false);
                    setActiveScreen('notes');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('flouss:open-add-note'));
                    }, 60);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-amber-500/15 border border-white/[0.06] hover:border-amber-500/30 text-start transition-all active:scale-95 duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-100 group-hover:text-amber-300 truncate">
                      {translations[language].notes.newNote}
                    </span>
                    <span className="block text-[10px] text-zinc-400 truncate">
                      {language === 'ar' ? 'فكرة أو قائمة' : 'Idée ou mémo'}
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomSheet isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} title={t.morePages}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-subtle bg-surface p-3">
            <div className="flex items-center gap-1 rounded-control border border-border-subtle bg-surface-raised p-0.5" role="group" aria-label={language === 'ar' ? 'اللغة' : language === 'fr' ? 'Langue' : 'Language'}>
              {([{ code: 'fr', label: 'FR' }, { code: 'ar', label: 'AR' }, { code: 'en', label: 'EN' }] as { code: Language; label: string }[]).map((item) => <button type="button" key={item.code} aria-pressed={language === item.code} onClick={() => setLanguage(item.code)} className={`min-h-11 rounded-control px-3 text-xs font-semibold ${language === item.code ? 'bg-surface text-content shadow-sm' : 'text-muted hover:text-content'}`}>{item.label}</button>)}
            </div>
            <button type="button" onClick={toggleTheme} aria-label={isDarkMode ? tCommon.switchToLight : tCommon.switchToDark} title={isDarkMode ? tCommon.switchToLight : tCommon.switchToDark} className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-subtle text-content hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
            <DynamicIsland />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {moreScreens.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => { setActiveScreen(item.id); setIsMoreMenuOpen(false); }} className="flex min-h-11 items-center gap-2 rounded-control border border-border-subtle bg-surface px-3 text-start text-sm text-content hover:bg-surface-raised">
                  <Icon className="h-4 w-4 shrink-0" /> <span className="min-w-0 break-words">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <button type="button" onClick={() => { setIsMoreMenuOpen(false); setIsProfileModalOpen(true); }} className="flex min-h-11 w-full items-center justify-between rounded-control border border-border-subtle bg-surface px-3 text-sm font-medium text-content">
              <span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{activeAccount?.name?.charAt(0).toUpperCase() || 'U'}</span>{activeAccount?.name || 'Profile'}</span><User className="h-4 w-4 text-muted" />
            </button>
            <button type="button" onClick={() => { playHapticFeedback('medium'); setIsMoreMenuOpen(false); logout(); }} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-negative/30 bg-negative/10 px-3 text-sm font-semibold text-negative">
              <LogOut className="h-4 w-4" />{isAr ? 'تسجيل الخروج' : language === 'fr' ? 'Se déconnecter' : 'Log out'}
            </button>
          </div>
        </div>
      </BottomSheet>
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
};
