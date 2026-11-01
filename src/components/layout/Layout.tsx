import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { QuickAddButton } from './QuickAddButton';
import { DynamicIsland } from './DynamicIsland';
import { useAppStore } from '../../store/useAppStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toggleHideBalance } = useAppStore();
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f6f3] dark:bg-[#191919] text-[#37352f] dark:text-[#ecebed] font-sans">
      {/* Desktop Notion Collapsible Sidebar */}
      <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* iOS Dynamic Island Activity Pill (Top-Center) */}
        <DynamicIsland />

        <Header />

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 px-4 sm:px-8 py-6 max-w-5xl w-full mx-auto">
          {children}
        </main>

        {/* Quick Add Floating Button (bottom-right) */}
        <QuickAddButton />

        {/* Mobile Navigation Bar */}
        <Navbar />
      </div>
    </div>
  );
};
