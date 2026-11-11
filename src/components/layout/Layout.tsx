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
import { AddContributionModal } from '../transactions/AddContributionModal';
import { CommandPalette } from './CommandPalette';
import { DashboardHeaderProvider } from './DashboardHeaderContext';
import { CosmicBackground } from './CosmicBackground';
import { useGlobalSpotlightTracker } from '../../hooks/useMousePosition';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toggleHideBalance, language, activeScreen } = useAppStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('expense');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  // Activate global follow-cursor spotlight tracker for all Bento cards
  useGlobalSpotlightTracker();

  // Auto-scroll to top immediately whenever activeScreen or view changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeScreen]);

  const openQuickAdd = useCallback((type: QuickAddType = 'expense') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  }, []);

  useEffect(() => {
    const handleQuickAdd = (event: Event) => {
      const type = (event as CustomEvent<{ type?: QuickAddType }>).detail?.type;
      openQuickAdd(type === 'income' ? 'income' : 'expense');
    };
    const handleContribution = () => {
      setIsContributionOpen(true);
    };
    window.addEventListener('flouss:quick-add', handleQuickAdd);
    window.addEventListener('flouss:open-contribution', handleContribution);
    return () => {
      window.removeEventListener('flouss:quick-add', handleQuickAdd);
      window.removeEventListener('flouss:open-contribution', handleContribution);
    };
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
    <div className="flex h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#050505] text-content font-sans relative">
      {/* Living Cosmic & Nebula Animated Starfield Background */}
      <CosmicBackground />

      {/* Desktop Notion Collapsible Sidebar */}
      <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 max-w-full overflow-x-hidden relative z-10">
        <Header />

        <main ref={mainRef} className="mx-auto max-w-[1280px] w-full flex-1 overflow-y-auto px-3.5 pb-28 pt-3 select-text sm:px-6 sm:pt-5 md:pb-8 lg:px-8 lg:pt-6 flex flex-col">
          {children}
        </main>

        {/* Desktop Quick Add Floating Button (strictly hidden on mobile) */}
        <QuickAddButton
          onAddExpense={() => openQuickAdd('expense')}
          onAddIncome={() => openQuickAdd('income')}
          onAddContribution={() => setIsContributionOpen(true)}
        />

        {/* Mobile Navigation Bar (strictly hidden on desktop) */}
        <Navbar onQuickAdd={() => openQuickAdd('expense')} />
        <QuickAddSheet isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} initialType={quickAddType} />
        <AddContributionModal isOpen={isContributionOpen} onClose={() => setIsContributionOpen(false)} />
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
