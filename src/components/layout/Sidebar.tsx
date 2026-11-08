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
        collapsed ? 'w-14' : 'w-[248px] md:max-lg:w-14'
      } transition-[width] duration-200 ease-out bg-surface border-r border-border-subtle shrink-0 justify-between select-none relative group/sidebar`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Header: Workspace / Logo + Collapse Button */}
        <div className="flex min-h-12 items-center justify-between border-b border-border-subtle p-2.5">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <span className="md:max-lg:hidden"><Logo size="sm" showWordmark={true} /></span>
              <button
                onClick={onToggleCollapse}
                title={tCommon.collapseSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={onToggleCollapse}
                title={tCommon.expandSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
              <span className="mb-1 block px-2 text-[10px] font-semibold uppercase tracking-wider text-muted md:max-lg:hidden">
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
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5 md:max-lg:justify-center md:max-lg:px-0'
                    } min-h-11 rounded-control text-xs transition-colors duration-150 z-10 ${
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
                    {!collapsed && <span className="truncate md:max-lg:hidden">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Section */}
          <div>
            {!collapsed && (
              <span className="mb-1 block px-2 text-[10px] font-semibold uppercase tracking-wider text-muted md:max-lg:hidden">
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
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5 md:max-lg:justify-center md:max-lg:px-0'
                    } min-h-11 rounded-control text-xs transition-colors duration-150 z-10 ${
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
                    {!collapsed && <span className="truncate md:max-lg:hidden">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Tab */}
          <div className="pt-2 border-t border-[#e3e2de] dark:border-[#2f2f2f]">
            <button
              onClick={() => setActiveScreen('settings')}
              aria-label={t.settings}
              title={collapsed ? t.settings : undefined}
              className={`relative w-full flex items-center ${
                collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5 md:max-lg:justify-center md:max-lg:px-0'
              } min-h-11 rounded-control text-xs transition-colors duration-150 z-10 ${
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
              {!collapsed && <span className="truncate md:max-lg:hidden">{t.settings}</span>}
            </button>
          </div>
        </div>

        {/* Bottom Profile Section (Single, authentic location for session profile) */}
        {activeAccount && (
          <div className="flex items-center gap-1 border-t border-border-subtle p-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              aria-label={activeAccount.name}
              title={collapsed ? activeAccount.name : undefined}
              className={`flex min-h-11 min-w-0 flex-1 items-center rounded-control p-1.5 text-start transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                collapsed ? 'justify-center' : 'justify-between gap-2 md:max-lg:justify-center'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: activeAccount.avatarColor || '#37352f' }}
                >
                  {activeAccount.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-content md:max-lg:hidden">
                      {activeAccount.name}
                    </span>
                  </div>
                )}
              </div>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted md:max-lg:hidden" />}
            </button>

            {!collapsed && (
              <button
                onClick={() => logout()}
                title={tCommon.logOut}
                aria-label={tCommon.logOut}
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-negative/10 hover:text-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:flex"
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
