import React, { useEffect } from 'react';
import { Header } from './Header';
import { Navbar } from './Navbar';
import { DynamicIsland } from './DynamicIsland';
import { InAppAlarmSheet } from '../common/InAppAlarmSheet';
import { ReconnectGoogleCalendarModal } from '../common/ReconnectGoogleCalendarModal';
import { AddToHomeScreenModal } from '../common/AddToHomeScreenModal';
import { useAppStore } from '../../store/useAppStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toggleHideBalance } = useAppStore();

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

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        toggleHideBalance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleHideBalance]);

  return (
    <div className="min-h-screen w-screen bg-zinc-200/60 dark:bg-zinc-950 flex justify-center items-center overflow-hidden">
      {/* Mobile-Only Constraint Wrapper on PC Desktop */}
      <div className="max-w-md mx-auto h-screen overflow-x-hidden border-x border-black/10 dark:border-white/10 shadow-2xl relative w-full flex flex-col bg-[#f7f6f3] dark:bg-[#191919] text-[#37352f] dark:text-[#ecebed] font-sans">
        {/* iOS Dynamic Island Activity Pill (Top-Center) */}
        <DynamicIsland />

        <Header />

        <main className="flex-1 overflow-y-auto pt-3 pb-24 px-3.5 w-full select-text">
          {children}
        </main>

        {/* Bottom Navigation Bar (Used on PC and Mobile) */}
        <Navbar />

        {/* Global In-App High Priority Alarm Sheet */}
        <InAppAlarmSheet />

        {/* Global Google Calendar Reconnect Sheet */}
        <ReconnectGoogleCalendarModal />

        {/* Global Add to Home Screen Sheet (iOS PWA) */}
        <AddToHomeScreenModal />
      </div>
    </div>
  );
};
