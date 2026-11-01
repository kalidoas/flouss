import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ScreenId } from '../../types';
import { translations } from '../../i18n/translations';
import { UserProfileModal } from '../profile/UserProfileModal';
import {
  LayoutDashboard,
  CheckSquare,
  HandCoins,
  Menu,
  Layers,
  ArrowDownLeft,
  History,
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  X,
  LogOut,
  User,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeScreen, setActiveScreen, language, logout, accounts, activeAccountId } = useAppStore();
  const t = translations[language].nav;
  const isAr = language === 'ar';

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const mainNavItems: {
    id: ScreenId | 'more';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
    { id: 'debts', label: t.debts, icon: HandCoins },
    { id: 'more', label: t.more, icon: Menu },
  ];

  const moreScreens: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'categories', label: t.categories, icon: Layers },
    { id: 'income', label: t.income, icon: ArrowDownLeft },
    { id: 'history', label: t.history, icon: History },
    { id: 'stats', label: t.stats, icon: BarChart3 },
    { id: 'subscriptions', label: t.subscriptions, icon: CreditCard },
    { id: 'notes', label: t.notes, icon: FileText },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Apple-style Bottom Navigation Bar with layoutId sliding pill */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border-t border-black/[0.06] dark:border-white/[0.08] px-4 py-2 safe-area-bottom shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'more' ? isMoreMenuOpen : activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'more') {
                    setIsMoreMenuOpen(true);
                  } else {
                    setActiveScreen(item.id as ScreenId);
                  }
                }}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors z-10 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-navbar-pill"
                    className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/15 rounded-xl -z-10"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 32,
                      mass: 0.8,
                    }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Menu Modal on Mobile */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          <div className="relative w-full max-h-[80vh] overflow-y-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t border-black/[0.08] dark:border-white/[0.1] z-10 space-y-4 pb-10 safe-area-bottom">
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto -mt-2 mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
                {t.morePages}
              </h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreScreens.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 font-semibold text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-black/[0.04] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Account Profile & Log Out Controls */}
            <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: activeAccount?.avatarColor || '#2383e2' }}
                  >
                    {activeAccount?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{activeAccount?.name || 'Mon Profil'}</span>
                </div>
                <User className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الخروج وقفل الجلسة' : language === 'en' ? 'Log out & Lock' : 'Se déconnecter (Verrouiller)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
