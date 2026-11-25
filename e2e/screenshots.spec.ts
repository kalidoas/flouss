import { test, expect } from '@playwright/test';

const LOCALES = ['ar', 'fr', 'en'] as const;
const THEMES = ['light', 'dark'] as const;
const WIDTHS = [390, 1280] as const;

const SCREENS: { screen: string; name: string }[] = [
  { screen: 'dashboard', name: 'dashboard' },
  { screen: 'categories', name: 'categories' },
  { screen: 'expenses', name: 'expenses' },
  { screen: 'income', name: 'income' },
  { screen: 'settings', name: 'settings' },
];

// Runs before any page script:
//  1. seed language/theme
//  2. wrap the Zustand store so Firebase's onAuthStateChanged (which fails
//     offline in CI and sets authGate:'signedOut') can never re-lock the app.
//     Any attempt to set a non-'app' authGate is rewritten to 'app'.
//     The guard stays alive for the whole test.
const prepareDemoStorage = ({ locale, theme }: { locale: string; theme: string }) => {
  localStorage.setItem('flouss_manual_language_selected', 'true');
  localStorage.setItem('flouss_app_storage_v2', JSON.stringify({ state: { language: locale }, version: 2 }));
  localStorage.setItem('flouss_theme', theme);
  (window as any).__DEMO__ = { locale, theme };

  const FORBIDDEN = new Set(['loading', 'signedOut', 'welcome', 'initialBalance', 'needsEmailVerif', 'locked']);
  const sanitize = (patch: any) => {
    if (!patch || typeof patch !== 'object') return patch;
    if (patch.authGate && FORBIDDEN.has(patch.authGate)) patch.authGate = 'app';
    return patch;
  };

  const wrap = () => {
    const store = (window as any).useAppStore;
    if (!store || store.__demoWrapped) return;
    const origSetState = store.setState.bind(store);
    const origSet = store.set.bind(store);
    store.setState = (patch: any, replace?: boolean) =>
      origSetState(
        typeof patch === 'function' ? (state: any) => sanitize(patch(state) || {}) : sanitize(patch),
        replace,
      );
    store.set = (patch: any, replace?: boolean) =>
      origSet(
        typeof patch === 'function' ? (state: any) => sanitize(patch(state) || {}) : sanitize(patch),
        replace,
      );
    store.__demoWrapped = true;
  };

  wrap();
  const iv = setInterval(() => {
    wrap();
    const s = (window as any).useAppStore?.getState?.();
    if (s && (FORBIDDEN.has(s.authGate) || s.authGate !== 'app')) {
      (window as any).useAppStore.setState({ authGate: 'app' });
    }
  }, 50);
  // keep the guard alive for the whole test; cleared automatically when the
  // page/context closes
  (window as any).__DEMO__IV = iv;
};

// Populate realistic demo data and select the screen to capture.
const applyDemoState = ({ locale, theme, screen }: { locale: string; theme: string; screen: string }) => {
  const appStore = (window as any).useAppStore;
  appStore?.setState?.({
    authGate: 'app',
    loadingAuth: false,
    hasSeenWelcome: true,
    hasSetInitialBalance: true,
    isPinVerified: true,
    isPinUnlocked: true,
    firebaseUser: { uid: 'demo_user_1', email: 'demo@flouss.live', emailVerified: true },
    userProfile: {
      uid: 'demo_user_1',
      email: 'demo@flouss.live',
      displayName: 'Demo',
      hasSeenWelcome: true,
      hasSetInitialBalance: true,
      hasPin: false,
      language: locale,
      currency: 'MAD',
    },
    activeScreen: screen,
    hideBalance: false,
    isBalanceHidden: false,
    initialBalance: 6200,
    categories: [
      { id: 'food', name: locale === 'ar' ? 'الطعام' : locale === 'fr' ? 'Alimentation' : 'Food', type: 'expense', color: '#16a34a', icon: 'ShoppingBasket' },
      { id: 'transport', name: locale === 'ar' ? 'النقل' : locale === 'fr' ? 'Transport' : 'Transport', type: 'expense', color: '#0284c7', icon: 'Bus' },
    ],
    transactions: [
      { id: 'demo-income', type: 'income', amount: 9400, categoryId: null, date: '2026-11-03', description: locale === 'ar' ? 'الراتب' : locale === 'fr' ? 'Salaire' : 'Salary', createdAt: '2026-11-03T12:00:00.000Z' },
      { id: 'demo-food', type: 'expense', amount: 285.5, categoryId: 'food', category: locale === 'ar' ? 'الطعام' : locale === 'fr' ? 'Alimentation' : 'Food', date: '2026-11-21', description: locale === 'ar' ? 'مشتريات الأسبوع' : locale === 'fr' ? 'Courses de la semaine' : 'Weekly groceries', createdAt: '2026-11-21T12:00:00.000Z' },
      { id: 'demo-transport', type: 'expense', amount: 40, categoryId: 'transport', category: locale === 'ar' ? 'النقل' : locale === 'fr' ? 'Transport' : 'Transport', date: '2026-11-23', description: locale === 'ar' ? 'تنقلات' : locale === 'fr' ? 'Déplacement' : 'Transport', createdAt: '2026-11-23T12:00:00.000Z' },
    ],
  });
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
};

const openDemoPage = async (
  page: import('@playwright/test').Page,
  locale: string,
  theme: string,
  screen: string,
) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page
    .waitForFunction(() => Boolean((window as any).useAppStore), undefined, { timeout: 15000 })
    .catch(() => {});
  // Apply repeatedly until the authenticated shell is actually mounted.
  // Firebase's onAuthStateChanged fires late and flips authGate to 'signedOut',
  // so we keep re-applying and re-checking for the sidebar/nav rather than
  // racing it with a fixed timeout.
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    await page.evaluate(applyDemoState, { locale, theme, screen }).catch(() => {});
    await page.waitForTimeout(120);
    const mounted = await page
      .evaluate(
        (s) =>
          Boolean(
            (window as any).useAppStore?.getState?.().authGate === 'app' &&
              document.querySelector('nav, aside, header'),
          ) && !document.querySelector('[role="status"]'),
        screen,
      )
      .catch(() => false);
    if (mounted) break;
  }
  await page.waitForTimeout(200);
};

test.describe('QA screenshots', () => {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        test(`screenshots ${locale}/${theme} ${width}px`, async ({ page }) => {
          await page.addInitScript(prepareDemoStorage, { locale, theme });
          await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
          for (const s of SCREENS) {
            await openDemoPage(page, locale, theme, s.screen);
            const filename = `${test.info().project.name}-${s.name}-${locale}-${theme}-${width}.png`;
            await page.screenshot({ path: `qa/integration/${filename}`, fullPage: true });
          }
        });
      }
    }
  }

  test('FAB opens expense modal (AR light)', async ({ page }) => {
    await page.addInitScript(prepareDemoStorage, { locale: 'ar', theme: 'light' });
    await openDemoPage(page, 'ar', 'light', 'dashboard');
    const fab = page.locator('button[aria-haspopup="menu"]');
    await expect(fab).toBeVisible({ timeout: 10000 });
    await fab.click({ force: true });
    await page.waitForTimeout(500);
    const addExpense = page.locator('div.fixed.bottom-24').getByRole('button').first();
    await expect(addExpense).toBeVisible({ timeout: 5000 });
    await addExpense.click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'qa/integration/fab-expense-modal-open.png', fullPage: true });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });
});
