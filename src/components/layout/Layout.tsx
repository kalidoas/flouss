import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { QuickAddButton } from './QuickAddButton';
import { InAppAlarmSheet } from '../common/InAppAlarmSheet';
import { ReconnectGoogleCalendarModal } from '../common/ReconnectGoogleCalendarModal';
import { AddToHomeScreenModal } from '../common/AddToHomeScreenModal';
import { useAppStore } from '../../store/useAppStore';
import { QuickAddSheet, QuickAddType } from '../transactions/QuickAddSheet';
import { CommandPalette } from './CommandPalette';
import { DashboardHeaderProvider } from './DashboardHeaderContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toggleHideBalance, language } = useAppStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('expense');

  const openQuickAdd = useCallback((type: QuickAddType = 'expense') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  }, []);

  useEffect(() => {
    const handleQuickAdd = (event: Event) => {
      const type = (event as CustomEvent<{ type?: QuickAddType }>).detail?.type;
      openQuickAdd(type === 'income' ? 'income' : 'expense');
    };
    window.addEventListener('flouss:quick-add', handleQuickAdd);
    return () => window.removeEventListener('flouss:quick-add', handleQuickAdd);
  }, [openQuickAdd]);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('flouss_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('flouss_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en';
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Keyboard shortcut: Press "H" to toggle Privacy Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'h' || e.key === 'H' || e.key === 'ا') {
        e.preventDefault();
        toggleHideBalance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleHideBalance]);

  return (
    <DashboardHeaderProvider>
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-content font-sans">
      {/* Desktop Notion Collapsible Sidebar */}
      <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header />

        <main className="mx-auto max-w-[1160px] w-full flex-1 overflow-y-auto px-4 pb-32 pt-4 select-text sm:px-8 sm:pt-6 md:pb-8 lg:px-10 lg:pt-8">
          {children}
        </main>

        {/* Desktop Quick Add Floating Button (strictly hidden on mobile) */}
        <div className="hidden md:block select-none">
          <QuickAddButton onClick={() => openQuickAdd('expense')} />
        </div>

        {/* Mobile Navigation Bar (strictly hidden on desktop) */}
        <Navbar onQuickAdd={() => openQuickAdd('expense')} />
        <QuickAddSheet isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} initialType={quickAddType} />
        <CommandPalette onQuickAdd={() => openQuickAdd('expense')} />

        {/* Global In-App High Priority Alarm Sheet */}
        <InAppAlarmSheet />

        {/* Global Google Calendar Reconnect Sheet */}
        <ReconnectGoogleCalendarModal />

        {/* Global Add to Home Screen Sheet (iOS PWA) */}
        <AddToHomeScreenModal />
      </div>
    </div>
    </DashboardHeaderProvider>
  );
};
