import React, { useEffect } from 'react';
import { useAppStore, applyThemeToDOM } from './store/useAppStore';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from '@firebase/auth';
import { Login } from './components/common/Login';
import { Layout } from './components/layout/Layout';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { InitialBalanceScreen } from './components/onboarding/InitialBalanceScreen';
import { PinLockModal } from './components/auth/PinLockModal';
import { PinAuthScreen } from './components/auth/PinAuthScreen';
import { EmailVerificationScreen } from './components/auth/EmailVerificationScreen';
import { GuidedTour } from './components/tour/GuidedTour';
import { Toast } from './components/common/Toast';
import { WelcomeModal } from './components/common/WelcomeModal';
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
  const authGate = useAppStore((s) => s.authGate);
  const activeScreen = useAppStore((s) => s.activeScreen);
  const theme = useAppStore((s) => s.theme);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const language = useAppStore((s) => s.language);
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const isPinUnlocked = useAppStore((s) => s.isPinUnlocked);
  const firebaseUser = useAppStore((s) => s.firebaseUser);
  const verify2FAPin = useAppStore((s) => s.verify2FAPin);
  const logout = useAppStore((s) => s.logout);

  // Listen to Firebase authentication state changes once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u: any) => {
      await useAppStore.getState().initAuthSession(u);
    });
    return () => unsubscribe();
  }, []);

  // Keep browser URLs and the selected page in sync, including direct links and Back/Forward.
  useEffect(() => {
    const routeFromPath = () => {
      const slug = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      const aliases: Record<string, any> = { '': 'dashboard', analytics: 'stats', statistics: 'stats' };
      const valid = ['dashboard', 'tasks', 'debts', 'subscriptions', 'notes', 'categories', 'income', 'expenses', 'history', 'stats', 'settings', 'accounts'];
      const screen = aliases[slug] || (valid.includes(slug) ? slug : 'dashboard');
      useAppStore.getState().setActiveScreen(screen);
    };
    routeFromPath();
    window.addEventListener('popstate', routeFromPath);
    return () => window.removeEventListener('popstate', routeFromPath);
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

  // Initialize Notification Service scheduler and reactive negative balance monitoring
  useEffect(() => {
    // 1. Start scheduler for due bills and in-app alerts (foreground layer)
    const stopScheduler = NotificationService.startScheduler(() => useAppStore.getState());

    // 2. Reactively monitor available balance for negative transitions
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

  // Cross-device sync: refresh state on app resumption, unlock, focus, or reconnect
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        useAppStore.getState().refreshFromFirestore();
      }
    };
    const handleOnline = () => {
      useAppStore.getState().refreshFromFirestore();
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 1. Loading Authentication & Firestore Profile (Neutral Apple Shimmer Skeleton)
  if (authGate === 'loading') {
    return <AppleShimmerSkeleton />;
  }

  // 2. Unauthenticated: Display Login Screen
  if (authGate === 'signedOut') {
    return <Login />;
  }

  // 3. Email Verification Gate (Email/password users only)
  if (authGate === 'needsEmailVerif') {
    return <EmailVerificationScreen />;
  }

  // 4. Locked Gate (PIN required)
  if (authGate === 'locked') {
    return (
      <PinAuthScreen
        user={firebaseUser}
        language={language}
        onVerify={verify2FAPin}
        onLogout={logout}
        onPinCreated={async (pin) => {
          await useAppStore.getState().setProfilePin(pin);
        }}
      />
    );
  }

  // 5. Welcome Gate (Brand-new user first time)
  if (authGate === 'welcome') {
    return <WelcomeModal />;
  }

  // 6. Initial Balance Gate (Brand-new user right after welcome)
  if (authGate === 'initialBalance') {
    return <InitialBalanceScreen />;
  }

  // 7. Main Application Screens
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
      <Layout>{renderScreen()}</Layout>
      <GuidedTour />
      <Toast />
    </>
  );
};

export default App;
