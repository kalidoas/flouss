import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Login } from './components/common/Login';
import { Layout } from './components/layout/Layout';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { PinLockModal } from './components/auth/PinLockModal';
import { PinAuthScreen } from './components/auth/PinAuthScreen';
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
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const activeScreen = useAppStore((s) => s.activeScreen);
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const isPinUnlocked = useAppStore((s) => s.isPinUnlocked);
  const firebaseUser = useAppStore((s) => s.firebaseUser);
  const loadingAuth = useAppStore((s) => s.loadingAuth);
  const isPinVerified = useAppStore((s) => s.isPinVerified);
  const userPinCode = useAppStore((s) => s.userPinCode);
  const verify2FAPin = useAppStore((s) => s.verify2FAPin);
  const logout = useAppStore((s) => s.logout);

  // Listen to Firebase authentication state changes once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      await useAppStore.getState().initAuthSession(u);
    });
    return () => unsubscribe();
  }, []);

  // Apply dark theme and language direction to <html>
  useEffect(() => {
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

    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (language === 'ar') {
      root.classList.add('font-arabic');
    } else {
      root.classList.remove('font-arabic');
    }
  }, [theme, language]);

  // 1. Loading Authentication & Firestore Profile
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#191919]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm font-medium">جاري التحقق من الحساب...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Display Real Google Sign-in Screen
  if (!firebaseUser) {
    return <Login />;
  }

  // 3. 2FA Step: If a PIN is configured for this account, verify PIN before granting access to dashboard
  if (userPinCode && !isPinVerified) {
    return (
      <PinAuthScreen
        user={firebaseUser}
        language={language}
        onVerify={verify2FAPin}
        onLogout={logout}
      />
    );
  }

  // 4. Authenticated & PIN Verified: If user has not completed initial onboarding, show onboarding modal
  if (!isOnboarded) {
    return <OnboardingModal />;
  }

  // 5. Main Application Screens
  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':     return <DashboardPage />;
      case 'tasks':         return <TasksPage />;
      case 'debts':         return <DebtsPage />;
      case 'subscriptions': return <SubscriptionsPage />;
      case 'notes':         return <NotesPage />;
      case 'categories':    return <CategoriesPage />;
      case 'income':        return <IncomePage />;
      case 'history':       return <HistoryPage />;
      case 'stats':         return <StatsPage />;
      case 'settings':      return <SettingsPage />;
      default:              return <DashboardPage />;
    }
  };

  return (
    <>
      {pinEnabled && !isPinUnlocked && <PinLockModal />}
      <Layout>{renderScreen()}</Layout>
      <GuidedTour />
      <Toast />
    </>
  );
};

export default App;
