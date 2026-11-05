import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ScreenId } from '../types';

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export type To = string | number;

/**
 * In-tree react-router-dom compatibility hook for Flouss.
 * Routes paths like '/income', '/expenses', '/dashboard' directly to activeScreen state.
 */
export function useNavigate() {
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);

  return useCallback(
    (to: To, _options?: NavigateOptions) => {
      if (typeof to === 'number') {
        if (typeof window !== 'undefined') {
          window.history.go(to);
        }
        return;
      }

      // Normalize path (e.g. '/income' -> 'income')
      const cleanPath = to.replace(/^\/+/, '').split('?')[0].split('#')[0].toLowerCase();

      const screenMap: Record<string, ScreenId> = {
        '': 'dashboard',
        dashboard: 'dashboard',
        income: 'income',
        expenses: 'expenses',
        expense: 'expenses',
        categories: 'categories',
        category: 'categories',
        tasks: 'tasks',
        debts: 'debts',
        subscriptions: 'subscriptions',
        subscription: 'subscriptions',
        notes: 'notes',
        history: 'history',
        stats: 'stats',
        settings: 'settings',
      };

      const targetScreen = cleanPath === 'analytics' ? 'stats' : screenMap[cleanPath] || (cleanPath as ScreenId);
      setActiveScreen(targetScreen);
    },
    [setActiveScreen]
  );
}

export function useLocation() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  return {
    pathname: `/${activeScreen}`,
    search: '',
    hash: '',
    state: null,
    key: 'default',
  };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return {} as T;
}
