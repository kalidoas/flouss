import React, { useEffect } from 'react';
import { useAppStore, applyThemeToDOM } from './store/useAppStore';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from '@firebase/auth';
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
import { ExpensesPage } from './pages/ExpensesPage';
import { NotificationService } from './services/notificationService';
import { calculateAvailableBalance } from './utils/calculations';

import { AppleShimmerSkeleton } from './components/common/AppleShimmerSkeleton';

export const App: React.FC = () => {
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const activeScreen = useAppStore((s) => s.activeScreen);
  const theme = useAppStore((s) => s.theme);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
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
    const unsubscribe = onAuthStateChanged(auth, async (u: any) => {
      await useAppStore.getState().initAuthSession(u);
    });
    return () => unsubscribe();
  }, []);

  // Apply dark theme and language direction to <html> and <body>
  useEffect(() => {
    const isDark =
      theme === 'dark'
        ? true
        : theme === 'light'
        ? false
        : typeof window !== 'undefined' &&
          Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

    applyThemeToDOM(isDark);

    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (language === 'ar') {
      root.classList.add('font-arabic');
    } else {
      root.classList.remove('font-arabic');
    }
  }, [theme, isDarkMode, language]);

  // Dynamic system theme change listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const currentTheme = useAppStore.getState().theme;
      if (currentTheme === 'system') {
        applyThemeToDOM(e.matches);
      }
    };
    media.addEventListener?.('change', handleMediaChange);
    return () => media.removeEventListener?.('change', handleMediaChange);
  }, []);

  // Initialize Notification Service, Scheduler, and Reactive Negative Balance monitoring
  useEffect(() => {
    // 1. Gracefully request notification permission if not yet decided
    if (NotificationService.isSupported() && NotificationService.getPermission() === 'default') {
      NotificationService.requestPermission().catch(() => {});
    }

    // 2. Start recurring background scheduler for due bills and precise 10m/exact event reminders
    const stopScheduler = NotificationService.startScheduler(() => useAppStore.getState());

    // 3. Reactively monitor available balance for negative transitions
    let previousBalance = calculateAvailableBalance(
      useAppStore.getState().initialBalance,
      useAppStore.getState().transactions
    );

    const unsubBalance = useAppStore.subscribe((state) => {
      const currentBalance = calculateAvailableBalance(state.initialBalance, state.transactions);
      if (previousBalance >= 0 && currentBalance < 0) {
        NotificationService.checkNegativeBalance(currentBalance, previousBalance, state.language);
      }
      previousBalance = currentBalance;
    });

    return () => {
      stopScheduler();
      unsubBalance();
    };
  }, []);

  // 1. Loading Authentication & Firestore Profile (Apple Shimmer Skeleton)
  if (loadingAuth) {
    return <AppleShimmerSkeleton />;
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
      case 'expenses':      return <ExpensesPage />;
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
