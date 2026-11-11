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
  TrendingDown,
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
  const tCommon = translations[language].common;
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
    { id: 'expenses', label: t.expenses, icon: TrendingDown },
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
        collapsed ? 'w-14' : 'w-[240px] md:max-lg:w-14'
      } transition-[width] duration-200 ease-out bg-[#08090E]/95 backdrop-blur-xl border-r border-white/[0.06] shrink-0 justify-between select-none relative group/sidebar z-20`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Header: Workspace / Logo + Collapse Button */}
        <div className="flex min-h-12 items-center justify-between border-b border-white/[0.06] p-2.5">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <span className="md:max-lg:hidden"><Logo size="sm" showWordmark={true} /></span>
              <button
                onClick={onToggleCollapse}
                title={tCommon.collapseSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={onToggleCollapse}
                title={tCommon.expandSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
              <span className="mb-1.5 block px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 md:max-lg:hidden">
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
                    aria-label={item.label}
                    title={collapsed ? item.label : undefined}
                    className={`relative w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-3 md:max-lg:justify-center md:max-lg:px-0'
                    } py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-150 z-10 ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-white/[0.08] border border-white/[0.08] shadow-[0_0_16px_rgba(99,102,241,0.22)] rounded-xl -z-10"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-indigo-300'
                          : 'text-zinc-400'
                      }`}
                    />
                    {!collapsed && <span className="truncate md:max-lg:hidden">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Section */}
          <div>
            {!collapsed && (
              <span className="mb-1.5 block px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 md:max-lg:hidden">
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
                    aria-label={item.label}
                    title={collapsed ? item.label : undefined}
                    className={`relative w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-3 md:max-lg:justify-center md:max-lg:px-0'
                    } py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-150 z-10 ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-white/[0.08] border border-white/[0.08] shadow-[0_0_16px_rgba(99,102,241,0.22)] rounded-xl -z-10"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-indigo-300'
                          : 'text-zinc-400'
                      }`}
                    />
                    {!collapsed && <span className="truncate md:max-lg:hidden">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Tab */}
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveScreen('settings')}
              aria-label={t.settings}
              title={collapsed ? t.settings : undefined}
              className={`relative w-full flex items-center ${
                collapsed ? 'justify-center px-0' : 'gap-2.5 px-3 md:max-lg:justify-center md:max-lg:px-0'
              } py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-150 z-10 ${
                activeScreen === 'settings'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              {activeScreen === 'settings' && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-white/[0.08] border border-white/[0.08] shadow-[0_0_16px_rgba(99,102,241,0.22)] rounded-xl -z-10"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                />
              )}
              <Settings
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeScreen === 'settings'
                    ? 'text-indigo-300'
                    : 'text-zinc-400'
                }`}
              />
              {!collapsed && <span className="truncate md:max-lg:hidden">{t.settings}</span>}
            </button>
          </div>
        </div>

        {/* Bottom Profile Section (Single, authentic location for session profile) */}
        {activeAccount && (
          <div className="flex items-center gap-1 border-t border-white/[0.06] p-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              aria-label={activeAccount.name}
              title={collapsed ? activeAccount.name : undefined}
              className={`flex min-h-10 min-w-0 flex-1 items-center rounded-xl p-1.5 text-start transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                collapsed ? 'justify-center' : 'justify-between gap-2 md:max-lg:justify-center'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: activeAccount.avatarColor || '#37352f' }}
                >
                  {activeAccount.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-zinc-200 md:max-lg:hidden">
                      {activeAccount.name}
                    </span>
                  </div>
                )}
              </div>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500 md:max-lg:hidden" />}
            </button>

            {!collapsed && (
              <button
                onClick={() => logout()}
                title={tCommon.logOut}
                aria-label={tCommon.logOut}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 lg:flex"
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
