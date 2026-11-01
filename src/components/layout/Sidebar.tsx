import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ScreenId } from '../../types';
import { translations } from '../../i18n/translations';
import { Logo } from '../common/Logo';
import { UserProfileModal } from '../profile/UserProfileModal';
import {
  LayoutDashboard,
  Tags,
  TrendingUp,
  History,
  PieChart,
  Settings,
  CheckSquare,
  HandCoins,
  CreditCard,
  FileText,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { activeScreen, setActiveScreen, accounts, activeAccountId, language, logout, firebaseUser } =
    useAppStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const t = translations[language].nav;
  const isAr = language === 'ar';

  const activeAccount =
    (accounts || []).find((a) => a.id === activeAccountId) ||
    (accounts || [])[0] ||
    (firebaseUser
      ? {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Utilisateur',
          email: firebaseUser.email || '',
          avatarColor: '#37352f',
        }
      : null);

  const financialItems: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'categories', label: t.categories, icon: Tags },
    { id: 'income', label: t.income, icon: TrendingUp },
    { id: 'history', label: t.history, icon: History },
    { id: 'stats', label: t.stats, icon: PieChart },
  ];

  const personalItems: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
    { id: 'debts', label: t.debts, icon: HandCoins },
    { id: 'subscriptions', label: t.subscriptions, icon: CreditCard },
    { id: 'notes', label: t.notes, icon: FileText },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col ${
        collapsed ? 'w-14' : 'w-60'
      } transition-[width] duration-200 ease-out bg-[#fbfbfa] dark:bg-[#1a1a1a] border-r border-[#e3e2de] dark:border-[#2f2f2f] shrink-0 justify-between select-none relative group/sidebar`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Header: Workspace / Logo + Collapse Button */}
        <div className="p-3 border-b border-[#e3e2de] dark:border-[#2f2f2f] flex items-center justify-between min-h-[49px]">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <Logo size="sm" showWordmark={true} />
              <button
                onClick={onToggleCollapse}
                title="Réduire la barre latérale"
                className="p-1 rounded text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={onToggleCollapse}
                title="Déplier la barre latérale"
                className="p-1 rounded text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Financial Section */}
          <div>
            {!collapsed && (
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#9b9a97] dark:text-[#787774] block mb-1">
                {t.financesSection}
              </span>
            )}
            <div className="space-y-0.5">
              {financialItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`relative w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
                    } py-1.5 rounded-lg text-xs transition-colors duration-150 z-10 ${
                      isActive
                        ? 'text-zinc-900 dark:text-white font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-[#efeeea] dark:bg-[#282828] rounded-lg -z-10 shadow-xs"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-[#787774] dark:text-[#9b9a97]'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Section */}
          <div>
            {!collapsed && (
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#9b9a97] dark:text-[#787774] block mb-1">
                {t.personalSection}
              </span>
            )}
            <div className="space-y-0.5">
              {personalItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`relative w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
                    } py-1.5 rounded-lg text-xs transition-colors duration-150 z-10 ${
                      isActive
                        ? 'text-zinc-900 dark:text-white font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-[#efeeea] dark:bg-[#282828] rounded-lg -z-10 shadow-xs"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-[#787774] dark:text-[#9b9a97]'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Tab */}
          <div className="pt-2 border-t border-[#e3e2de] dark:border-[#2f2f2f]">
            <button
              onClick={() => setActiveScreen('settings')}
              title={collapsed ? t.settings : undefined}
              className={`relative w-full flex items-center ${
                collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
              } py-1.5 rounded-lg text-xs transition-colors duration-150 z-10 ${
                activeScreen === 'settings'
                  ? 'text-zinc-900 dark:text-white font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {activeScreen === 'settings' && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-[#efeeea] dark:bg-[#282828] rounded-lg -z-10 shadow-xs"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                />
              )}
              <Settings
                className={`w-4 h-4 shrink-0 ${
                  activeScreen === 'settings'
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-[#787774] dark:text-[#9b9a97]'
                }`}
              />
              {!collapsed && <span className="truncate">{t.settings}</span>}
            </button>
          </div>
        </div>

        {/* Bottom Profile Section (Single, authentic location for session profile) */}
        {activeAccount && (
          <div className="p-2 border-t border-[#e3e2de] dark:border-[#2f2f2f] flex items-center gap-1">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title={collapsed ? activeAccount.name : undefined}
              className={`flex-1 p-1.5 rounded-xl hover:bg-[#f1f0ee] dark:hover:bg-[#242424] flex items-center ${
                collapsed ? 'justify-center' : 'justify-between gap-2'
              } transition-colors text-left min-w-0`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-xs"
                  style={{ backgroundColor: activeAccount.avatarColor || '#37352f' }}
                >
                  {activeAccount.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <span className="font-semibold text-xs text-[#37352f] dark:text-[#ecebed] truncate block">
                      {activeAccount.name}
                    </span>
                  </div>
                )}
              </div>
              {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-[#787774] shrink-0" />}
            </button>

            {!collapsed && (
              <button
                onClick={() => logout()}
                title={isAr ? 'تسجيل الخروج' : language === 'en' ? 'Log out' : 'Déconnexion'}
                className="p-1.5 rounded-lg text-[#787774] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </aside>
  );
};
