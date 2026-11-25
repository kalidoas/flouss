import { test, expect } from '@playwright/test';

const LOCALES = ['ar', 'fr', 'en'] as const;
const THEMES = ['light', 'dark'] as const;
const WIDTHS = [390, 1280] as const;

const PAGES = [
  { path: '/', name: 'dashboard' },
  { path: '/categories', name: 'categories' },
  { path: '/expenses', name: 'expenses' },
  { path: '/income', name: 'income' },
  { path: '/settings', name: 'settings' },
];

const prepareDemoStorage = ({ locale, theme }: { locale: string; theme: string }) => {
  localStorage.setItem('flouss_manual_language_selected', 'true');
  localStorage.setItem('flouss_app_storage_v2', JSON.stringify({ state: { language: locale }, version: 2 }));
  localStorage.setItem('flouss_theme', theme);
};

const applyDemoState = ({ locale, theme, activeScreen }: { locale: string; theme: string; activeScreen?: string }) => {
  const appStore = (window as Window & { useAppStore?: { getState?: () => { authGate?: string }; setState?: (state: unknown) => void } }).useAppStore;
  appStore?.setState?.({
    authGate: 'app',
    loadingAuth: false,
    hasSeenWelcome: true,
    hasSetInitialBalance: true,
    isPinVerified: true,
    isPinUnlocked: true,
    firebaseUser: null,
    userProfile: null,
    language: locale,
    theme,
    isDarkMode: theme === 'dark',
    activeScreen: activeScreen ?? 'dashboard',
    hideBalance: false,
    isBalanceHidden: false,
    initialBalance: 6200,
    categories: [
      { id: 'food', name: locale === 'ar' ? 'الطعام' : locale === 'fr' ? 'Alimentation' : 'Food', type: 'expense', color: '#16a34a', icon: 'ShoppingBasket' },
      { id: 'transport', name: locale === 'ar' ? 'النقل' : locale === 'fr' ? 'Transport' : 'Transport', type: 'expense', color: '#0284c7', icon: 'Bus' },
    ],
    transactions: [
      { id: 'demo-income', type: 'income', amount: 9400, date: '2026-11-03', description: locale === 'ar' ? 'الراتب' : locale === 'fr' ? 'Salaire' : 'Salary', createdAt: '2026-11-03T12:00:00.000Z' },
      { id: 'demo-food', type: 'expense', amount: 285.5, categoryId: 'food', category: locale === 'ar' ? 'الطعام' : locale === 'fr' ? 'Alimentation' : 'Food', date: '2026-11-21', description: locale === 'ar' ? 'مشتريات الأسبوع' : locale === 'fr' ? 'Courses de la semaine' : 'Weekly groceries', createdAt: '2026-11-21T12:00:00.000Z' },
      { id: 'demo-transport', type: 'expense', amount: 40, categoryId: 'transport', category: locale === 'ar' ? 'تنقلات' : locale === 'fr' ? 'Déplacement' : 'Transport', date: '2026-11-23', description: locale === 'ar' ? 'تنقلات' : locale === 'fr' ? 'Déplacement' : 'Transport', createdAt: '2026-11-23T12:00:00.000Z' },
    ],
  });
};

const openDemoPage = async (
  page: import('@playwright/test').Page,
  path: string,
  locale: string,
  theme: string,
  activeScreen?: string,
) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as Window & { useAppStore?: { getState?: () => { authGate?: string } } }).useAppStore?.getState?.().authGate !== 'loading');
  await page.evaluate(applyDemoState, { locale, theme, activeScreen });
  await page.waitForTimeout(150);
};

test.describe('QA screenshots', () => {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        test(`screenshots ${locale}/${theme} ${width}px`, async ({ page }) => {
          await page.addInitScript(prepareDemoStorage, { locale, theme });
          await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
          for (const p of PAGES) {
            await openDemoPage(page, p.path, locale, theme, p.name);
            const filename = `${test.info().project.name}-${p.name}-${locale}-${theme}-${width}.png`;
            await page.screenshot({ path: `qa/integration/${filename}`, fullPage: true });
          }
        });
      }
    }
  }

  test('FAB opens expense modal', async ({ page }) => {
    await page.addInitScript(prepareDemoStorage, { locale: 'ar', theme: 'light' });
    await openDemoPage(page, '/', 'ar', 'light');
    const fab = page.locator('button[aria-haspopup="menu"]');
    if (await fab.count() > 0) {
      await fab.click();
      await page.waitForTimeout(300);
      const addExpense = page.locator('div.fixed.bottom-24').getByRole('button').first();
      if (await addExpense.count() > 0) {
        await addExpense.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'qa/integration/fab-expense-modal-open.png', fullPage: true });
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    }
  });
});
