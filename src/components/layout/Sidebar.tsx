import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ScreenId } from '../../types';
import { translations } from '../../i18n/translations';
import { Logo } from '../common/Logo';
import { AccountSwitcherModal } from '../accounts/AccountSwitcherModal';
import {
  LayoutDashboard,
  Layers,
  ArrowDownLeft,
  History,
  BarChart3,
  Settings,
  ChevronDown,
  CheckSquare,
  HandCoins,
  CreditCard,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { activeScreen, setActiveScreen, language, accounts, activeAccountId, logout } = useAppStore();
  const t = translations[language].nav;
  const isAr = language === 'ar';
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  const financialItems: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'categories', label: t.categories, icon: Layers },
    { id: 'income', label: t.income, icon: ArrowDownLeft },
    { id: 'history', label: t.history, icon: History },
    { id: 'stats', label: t.stats, icon: BarChart3 },
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
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
                    } py-1.5 rounded-md text-xs font-normal transition-colors duration-100 ${
                      isActive
                        ? 'bg-[#efeeea] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed] font-medium'
                        : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#f1f0ee] dark:hover:bg-[#242424] hover:text-[#37352f] dark:hover:text-[#ecebed]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#37352f] dark:text-[#ecebed]' : 'text-[#787774] dark:text-[#9b9a97]'
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
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
                    } py-1.5 rounded-md text-xs font-normal transition-colors duration-100 ${
                      isActive
                        ? 'bg-[#efeeea] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed] font-medium'
                        : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#f1f0ee] dark:hover:bg-[#242424] hover:text-[#37352f] dark:hover:text-[#ecebed]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#37352f] dark:text-[#ecebed]' : 'text-[#787774] dark:text-[#9b9a97]'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Item */}
          <div className="pt-2 border-t border-[#e3e2de] dark:border-[#2f2f2f]">
            <button
              onClick={() => setActiveScreen('settings')}
              title={collapsed ? t.settings : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
              } py-1.5 rounded-md text-xs font-normal transition-colors duration-100 ${
                activeScreen === 'settings'
                  ? 'bg-[#efeeea] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed] font-medium'
                  : 'text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#f1f0ee] dark:hover:bg-[#242424] hover:text-[#37352f] dark:hover:text-[#ecebed]'
              }`}
            >
              <Settings
                className={`w-4 h-4 shrink-0 ${
                  activeScreen === 'settings'
                    ? 'text-[#37352f] dark:text-[#ecebed]'
                    : 'text-[#787774] dark:text-[#9b9a97]'
                }`}
              />
              {!collapsed && <span className="truncate">{t.settings}</span>}
            </button>
          </div>
        </div>

        {/* Bottom Profile / Account Switcher */}
        {activeAccount && (
          <div className="p-2 border-t border-[#e3e2de] dark:border-[#2f2f2f] flex items-center gap-1">
            <button
              onClick={() => setIsAccountModalOpen(true)}
              title={collapsed ? activeAccount.name : undefined}
              className={`flex-1 p-1.5 rounded-md hover:bg-[#f1f0ee] dark:hover:bg-[#242424] flex items-center ${
                collapsed ? 'justify-center' : 'justify-between gap-2'
              } transition-colors text-left min-w-0`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-semibold text-[10px] shrink-0"
                  style={{ backgroundColor: activeAccount.avatarColor || '#37352f' }}
                >
                  {activeAccount.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <span className="font-medium text-xs text-[#37352f] dark:text-[#ecebed] truncate block">
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
                className="p-1.5 rounded-md text-[#787774] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <AccountSwitcherModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </aside>
  );
};
