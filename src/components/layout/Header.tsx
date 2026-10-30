import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Eye, EyeOff, Moon, Sun, LogOut, Users } from 'lucide-react';
import { Logo } from '../common/Logo';
import { AccountSwitcherModal } from '../accounts/AccountSwitcherModal';

export const Header: React.FC = () => {
  const {
    hideBalance,
    toggleHideBalance,
    theme,
    setTheme,
    logout,
    accounts,
    activeAccountId,
    language,
  } = useAppStore();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const isAr = language === 'ar';

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#191919]/90 backdrop-blur-sm border-b border-[#e3e2de] dark:border-[#2f2f2f] px-3 sm:px-6 py-2 flex items-center justify-between">
        {/* Brand logo on mobile */}
        <div className="flex md:hidden items-center">
          <Logo size="sm" showWordmark={true} />
        </div>

        {/* Desktop breadcrumb / user indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#787774] dark:text-[#9b9a97]">
          <span className="font-medium text-[#37352f] dark:text-[#ecebed]">Flouss</span>
          <span>/</span>
          {activeAccount ? (
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-[#37352f] dark:hover:text-[#ecebed] transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: activeAccount.avatarColor || '#2383e2' }}
              >
                {activeAccount.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-[#37352f] dark:text-[#ecebed]">
                {activeAccount.name}
              </span>
            </button>
          ) : (
            <span className="capitalize">Espace personnel</span>
          )}
        </div>

        {/* Header Controls: User switcher, Privacy mode, Theme toggle & LOG OUT */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* User Profile Pill button (opens account switcher) */}
          {activeAccount && (
            <button
              onClick={() => setIsAccountModalOpen(true)}
              title={isAr ? 'تبديل الحساب' : 'Changer d’utilisateur'}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[#e3e2de] dark:border-[#2f2f2f] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] text-[#37352f] dark:text-[#ecebed] transition-colors"
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                style={{ backgroundColor: activeAccount.avatarColor || '#2383e2' }}
              >
                {activeAccount.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] font-medium max-w-[70px] sm:max-w-[100px] truncate">
                {activeAccount.name}
              </span>
            </button>
          )}

          {/* Toggle hide balance with keyboard hint */}
          <button
            onClick={toggleHideBalance}
            title={hideBalance ? 'Afficher les montants (H)' : 'Masquer les montants (H)'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-normal transition-colors ${
              hideBalance
                ? 'bg-[#efeeea] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed]'
                : 'text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed] hover:bg-[#f1f0ee] dark:hover:bg-[#282828]'
            }`}
            aria-label="Toggle privacy"
          >
            {hideBalance ? <EyeOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[10px] font-mono text-[#9b9a97] dark:text-[#787774]">
              H
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Changer de thème"
            className="p-1.5 rounded-md text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Explicit LOG OUT Button */}
          <button
            onClick={() => logout()}
            title={isAr ? 'تسجيل الخروج وقفل الجلسة' : 'Se déconnecter (Verrouiller)'}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isAr ? 'خروج' : 'Déconnexion'}
            </span>
          </button>
        </div>
      </header>

      <AccountSwitcherModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </>
  );
};
