import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ScreenId } from '../../types';
import { translations } from '../../i18n/translations';
import { playHapticFeedback } from '../../utils/haptics';
import { UserProfileModal } from '../profile/UserProfileModal';
import { BottomSheet } from '../common/BottomSheet';
import {
  LayoutDashboard, TrendingDown, Plus, CheckSquare, BarChart3, Layers,
  TrendingUp, History, Settings, FileText, HandCoins, CreditCard, LogOut, User,
} from 'lucide-react';

interface NavbarProps {
  onQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickAdd }) => {
  const { activeScreen, setActiveScreen, language, logout, accounts, activeAccountId, firebaseUser } = useAppStore();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const t = translations[language].nav;
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
      <nav aria-label={language === 'ar' ? 'التنقل الرئيسي' : language === 'fr' ? 'Navigation principale' : 'Main navigation'} className="md:hidden fixed bottom-0 inset-x-0 z-[100] grid grid-cols-5 items-center border-t border-border-subtle bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1.5 backdrop-blur-xl">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const selected = activeScreen === item.id;
          return (
            <button key={item.id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => { playHapticFeedback('light'); setActiveScreen(item.id); }} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-control px-1 ${selected ? 'text-accent' : 'text-muted'}`}>
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={onQuickAdd} aria-label={translations[language].common.quickAdd} className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-md active:scale-95">
          <Plus className="h-6 w-6" strokeWidth={2.25} />
        </button>
        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const selected = activeScreen === item.id;
          return (
            <button key={item.id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => { playHapticFeedback('light'); setActiveScreen(item.id); }} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-control px-1 ${selected ? 'text-accent' : 'text-muted'}`}>
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <BottomSheet isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} title={t.morePages}>
        <div className="space-y-4">
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
