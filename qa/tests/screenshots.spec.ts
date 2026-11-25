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

// Poll store until hydrated then inject demo auth state
const injectDemoState = `(locale, theme) => {
  (window as any).useAppStore = (window as any).useAppStore || null;
  const trySet = () => {
    const store = (window as any).useAppStore?.getState?.();
    if (store) {
      (window as any).useAppStore.setState({
        authGate: 'app',
        hasSeenWelcome: true,
        hasSetInitialBalance: true,
        isPinVerified: true,
        firebaseUser: { uid: 'demo_user_1', email: 'demo@flouss.live', displayName: 'Demo' },
        userProfile: {
          uid: 'demo_user_1',
          email: 'demo@flouss.live',
          displayName: 'Demo',
          hasSeenWelcome: true,
          hasSetInitialBalance: true,
          hasPin: false,
          language: locale,
          currency: 'MAD'
        }
      });
      return true;
    }
    return false;
  };
  if (!trySet()) {
    const iv = setInterval(() => { if (trySet()) clearInterval(iv); }, 100);
    setTimeout(() => clearInterval(iv), 5000);
  }
  localStorage.setItem('flouss_language', locale);
  localStorage.setItem('flouss_theme', theme);
}`;

test.describe('QA screenshots', () => {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        test(`screenshots ${locale}/${theme} ${width}px`, async ({ page }) => {
          await page.addInitScript(injectDemoState, [locale, theme]);
          for (const p of PAGES) {
            await page.goto(p.path, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);
            const filename = `${p.name}-${locale}-${theme}-${width}.png`;
            await page.screenshot({ path: `qa/integration/${filename}`, fullPage: true });
          }
        });
      }
    }
  }

  test('FAB opens expense modal', async ({ page }) => {
    await page.addInitScript(injectDemoState, ['ar', 'light']);
    await page.goto('/');
    await page.waitForTimeout(1000);
    const fab = page.locator('button[aria-haspopup="menu"]');
    if (await fab.count() > 0) {
      await fab.click();
      await page.waitForTimeout(300);
      const addExpense = page.locator('button:has-text("مصروف"), button:has-text("Dépense"), button:has-text("Expense")').first();
      if (await addExpense.count() > 0) {
        await addExpense.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'qa/integration/fab-expense-modal-open.png', fullPage: true });
      }
    }
  });
});
