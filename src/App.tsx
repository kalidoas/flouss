import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Login } from './components/common/Login';
import { Layout } from './components/layout/Layout';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { PinLockModal } from './components/auth/PinLockModal';
import { GuidedTour } from './components/tour/GuidedTour';
import { Toast } from './components/common/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { IncomePage } from './pages/IncomePage';
import { HistoryPage } from './pages/HistoryPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TasksPage } from './pages/TasksPage';
import { DebtsPage } from './pages/DebtsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { NotesPage } from './pages/NotesPage';

export const App: React.FC = () => {
  const { isOnboarded, activeScreen, theme, language, pinEnabled, isPinUnlocked } =
    useAppStore();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
  }, []);

  useEffect(() => {
    // Ensure dark mode class is properly synced on mount
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Ensure language & dir are synced
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (language === 'ar') {
      root.classList.add('font-arabic');
    } else {
      root.classList.remove('font-arabic');
    }
  }, [theme, language]);

  // If user has not completed onboarding, show full-screen onboarding modal
  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Login />;
  if (!isOnboarded) {
    return <OnboardingModal />;
  }

  // Render current active screen
  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tasks':
        return <TasksPage />;
      case 'debts':
        return <DebtsPage />;
      case 'subscriptions':
        return <SubscriptionsPage />;
      case 'notes':
        return <NotesPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'income':
        return <IncomePage />;
      case 'history':
        return <HistoryPage />;
      case 'stats':
        return <StatsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      {/* PIN Lock / Session Gate */}
      {!isPinUnlocked && <PinLockModal />}

      {/* Main Layout & Active View */}
      <Layout>{renderScreen()}</Layout>

      {/* Guided Walkthrough Tour */}
      <GuidedTour />

      {/* Global Toast for 5-Second Undo & Notifications */}
      <Toast />
    </>
  );
};

export default App;
