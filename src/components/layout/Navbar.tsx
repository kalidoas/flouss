import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ScreenId } from '../../types';
import { translations } from '../../i18n/translations';
import { AccountSwitcherModal } from '../accounts/AccountSwitcherModal';
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
  Users,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeScreen, setActiveScreen, language, logout, accounts, activeAccountId } = useAppStore();
  const t = translations[language].nav;
  const isAr = language === 'ar';

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const mainNavItems: {
    id: ScreenId | 'more';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'tasks', label: isAr ? 'البرنامج' : 'Tâches', icon: CheckSquare },
    { id: 'debts', label: isAr ? 'الكريدي' : 'Dettes', icon: HandCoins },
    { id: 'more', label: isAr ? 'المزيد' : 'Menu', icon: Menu },
  ];

  const moreScreens: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'categories', label: t.categories, icon: Layers },
    { id: 'income', label: t.income, icon: ArrowDownLeft },
    { id: 'history', label: t.history, icon: History },
    { id: 'stats', label: t.stats, icon: BarChart3 },
    { id: 'subscriptions', label: isAr ? 'فواتير واشتراكات' : 'Charges Fixes', icon: CreditCard },
    { id: 'notes', label: isAr ? 'ملاحظات' : 'Notes', icon: FileText },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Notion-style Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border-t border-[#e3e2de] dark:border-[#2f2f2f] px-4 py-1.5 safe-area-bottom shadow-sm">
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
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-md transition-colors ${
                  isActive
                    ? 'text-[#2383e2] dark:text-[#2383e2] font-medium'
                    : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-[#ecebed]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
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
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          <div className="relative w-full max-h-[80vh] overflow-y-auto bg-white dark:bg-[#202020] rounded-t-xl p-5 shadow-xl border-t border-[#e3e2de] dark:border-[#2f2f2f] z-10 space-y-3 pb-8 safe-area-bottom">
            <div className="w-10 h-1 bg-[#e3e2de] dark:bg-[#2f2f2f] rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-[#e3e2de] dark:border-[#2f2f2f]">
              <h3 className="font-semibold text-sm text-[#37352f] dark:text-[#ecebed]">
                {isAr ? 'الصفحات والأقسام' : 'Toutes les rubriques'}
              </h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded text-[#787774] hover:text-[#37352f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                      isActive
                        ? 'bg-[#f1f0ee] dark:bg-[#282828] border-[#d3d1cb] dark:border-[#3f3f3f] font-medium text-[#37352f] dark:text-[#ecebed]'
                        : 'bg-white dark:bg-[#1a1a1a] border-[#e3e2de] dark:border-[#2f2f2f] text-[#5f5e5b] dark:text-[#9b9a97]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#787774] dark:text-[#9b9a97] shrink-0" />
                    <span className="text-xs truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Account & Log Out Controls */}
            <div className="pt-2 border-t border-[#e3e2de] dark:border-[#2f2f2f] space-y-2">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsAccountModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-xs font-medium text-[#37352f] dark:text-[#ecebed] hover:bg-[#f1f0ee]"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: activeAccount?.avatarColor || '#2383e2' }}
                  >
                    {activeAccount?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{isAr ? 'تبديل الحساب' : 'Changer d’utilisateur'}</span>
                </div>
                <Users className="w-4 h-4 text-[#787774]" />
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100/80 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الخروج (قفل الجلسة)' : 'Se déconnecter (Verrouiller)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AccountSwitcherModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </>
  );
};
