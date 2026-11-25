import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright/index.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const landingDir = path.resolve(scriptDir, '../..');
const outputDir = path.join(scriptDir, 'output');
const screenshotDir = path.join(outputDir, 'screenshots');
let baseUrl = process.env.LANDING_URL;
const locales = ['ar', 'fr', 'en'];
const themes = ['light', 'dark'];
const widths = [{ width: 390, height: 844 }];
const reports = [];

function colorChannels(color) {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const value = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex;
    return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  }
  const values = color.match(/[\d.]+/g);
  if (!values || values.length < 3) throw new Error(`Unsupported computed color: ${color}`);
  return values.slice(0, 3).map(Number);
}

function luminance(color) {
  const [red, green, blue] = colorChannels(color).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

await mkdir(screenshotDir, { recursive: true });

let server;
let browser;

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

async function getAvailablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('Could not determine an available preview port');
  await new Promise((resolve, reject) => {
    probe.close((error) => error ? reject(error) : resolve());
  });
  return address.port;
}

if (!process.env.LANDING_URL) {
  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [path.join(landingDir, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: landingDir,
    stdio: 'ignore',
  });
}

try {
  await waitForServer(baseUrl);
  browser = await chromium.launch({ headless: true });
  for (const locale of locales) {
    const suffix = locale === 'ar' ? '' : `-${locale}`;
    const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await ogPage.goto(pathToFileURL(path.join(landingDir, `public/images/og${suffix}.svg`)).href);
    await ogPage.screenshot({ path: path.join(landingDir, `public/images/og${suffix}.png`) });
    await ogPage.close();
  }

  for (const locale of locales) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const localePath = locale === 'ar' ? '/' : `/${locale}/`;
      await page.goto(`${baseUrl}${localePath}`, { waitUntil: 'networkidle' });
      if (theme === 'dark') {
        await page.locator('.theme-toggle').first().click();
        await page.waitForTimeout(220);
      }

      const expectedWordmark = locale === 'ar' ? 'فلوس' : 'Flouss';
      for (const viewport of widths) {
        await page.setViewportSize(viewport);
        const state = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          theme: document.querySelector('.site')?.getAttribute('data-theme'),
          width: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          headerWordmark: document.querySelector('.topbar .brand__name')?.textContent?.trim(),
          footerWordmark: document.querySelector('.footer .brand__name')?.textContent?.trim(),
          footerCopyright: document.querySelector('.footer__copyright')?.textContent?.trim(),
          logoMark: document.querySelector('.topbar .brand__mark')?.innerHTML ?? '',
          ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
          pageColor: getComputedStyle(document.querySelector('.site')).getPropertyValue('--page').trim(),
          textColor: getComputedStyle(document.querySelector('.site')).getPropertyValue('--text').trim(),
          stepNumberText: getComputedStyle(document.querySelector('.step__top > span')).color,
          stepNumberSurface: getComputedStyle(document.querySelector('.site')).getPropertyValue('--page').trim(),
          featureNumberText: getComputedStyle(document.querySelector('.feature__number')).color,
          featureNumberSurface: getComputedStyle(document.querySelector('.features-section')).backgroundColor,
          ctaText: getComputedStyle(document.querySelector('.hero__actions .button')).color,
          ctaSurface: getComputedStyle(document.querySelector('.hero__actions .button')).backgroundColor,
          cta: document.querySelector('.hero__actions .button')?.getAttribute('href'),
          headlineLines: document.querySelectorAll('.hero h1 .hero__headline-line').length,
          animatedWords: document.querySelectorAll('.hero h1 .hero__word').length,
          mockupLabel: document.querySelector('.hero-stage__mockup-label')?.textContent?.trim(),
          billCard: document.querySelectorAll('.hero-stage__bill-chip').length,
          installSteps: document.querySelectorAll('.install-step').length,
        }));
        if (state.lang !== locale) throw new Error(`${locale}/${theme}: expected lang=${locale}, got ${state.lang}`);
        if (state.dir !== (locale === 'ar' ? 'rtl' : 'ltr')) throw new Error(`${locale}/${theme}: incorrect text direction`);
        if (state.theme !== theme) throw new Error(`${locale}/${theme}: expected ${theme} theme, got ${state.theme}`);
        if (state.width > state.viewport) throw new Error(`${locale}/${theme}/${viewport.width}: horizontal overflow ${state.width}px`);
        if (state.headerWordmark !== expectedWordmark || state.footerWordmark !== expectedWordmark) {
          throw new Error(`${locale}/${theme}: logo wordmark is not localized`);
        }
        if (!state.footerCopyright?.endsWith(expectedWordmark)) throw new Error(`${locale}/${theme}: footer copyright wordmark is not localized`);
        const expectedOgImage = `https://flouss.live/images/og${locale === 'ar' ? '' : `-${locale}`}.png`;
        if (state.ogImage !== expectedOgImage) throw new Error(`${locale}/${theme}: Open Graph image is not localized`);
        if (state.logoMark.includes('>ف<') || state.logoMark.includes('>Flouss<')) {
          throw new Error(`${locale}/${theme}: logo mark contains a language-specific character`);
        }
        if (await page.locator('.hero__seal').count() !== 0) throw new Error(`${locale}/${theme}: Morocco badge remains in the hero`);
        if (state.headlineLines !== 2 || state.animatedWords < 2) throw new Error(`${locale}/${theme}: expected two word-animated headline parts`);
        if (!state.mockupLabel || state.billCard !== 1) throw new Error(`${locale}/${theme}: illustrative mockup or upcoming bill card is missing`);
        if (state.installSteps !== 3) throw new Error(`${locale}/${theme}: expected three iPhone installation steps`);
        if (!state.cta?.startsWith('https://')) throw new Error(`${locale}/${theme}: CTA must use HTTPS`);
        if (contrast(state.textColor, state.pageColor) < 4.5) throw new Error(`${locale}/${theme}: text contrast is below AA`);
        if (contrast(state.stepNumberText, state.stepNumberSurface) < 4.5) throw new Error(`${locale}/${theme}: step number contrast is below AA`);
        if (contrast(state.featureNumberText, state.featureNumberSurface) < 3) throw new Error(`${locale}/${theme}: feature number contrast is below 3:1`);
        if (contrast(state.ctaText, state.ctaSurface) < 4.5) {
          throw new Error(`${locale}/${theme}: CTA contrast is below AA (${state.ctaText} on ${state.ctaSurface})`);
        }

        await page.emulateMedia({ reducedMotion: 'reduce' });
        const reducedMotion = await page.evaluate(() => ({
          wordAnimation: getComputedStyle(document.querySelector('.hero__word')).animationName,
          stageAnimation: getComputedStyle(document.querySelector('.hero-stage__phone')).animationName,
          scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        }));
        if (reducedMotion.wordAnimation !== 'none' || reducedMotion.stageAnimation !== 'none' || reducedMotion.scrollBehavior !== 'auto') {
          throw new Error(`${locale}/${theme}: reduced-motion fallback is incomplete`);
        }
        await page.emulateMedia({ reducedMotion: 'no-preference' });

        const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < totalHeight; y += Math.max(360, Math.floor(viewport.height * 0.75))) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(70);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.addStyleTag({
          content: `
            .intro-section, .features-section, .privacy-section, .closing-section, .footer {
              content-visibility: visible !important;
              contain-intrinsic-size: none !important;
            }
            .intro-section .section-heading, .step, .features-section .section-heading,
            .feature, .privacy-panel, .closing-panel {
              animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important;
            }
          `,
        });
        const screenshot = path.join(screenshotDir, `${locale}-${theme}-${viewport.width}.png`);
        await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
        reports.push({ locale, theme, viewport: viewport.width, screenshot, ...state });
      }

      if (pageErrors.length) throw new Error(`${locale}/${theme}: ${pageErrors.join('; ')}`);
      await context.close();
    }
  }

  if (reports.length !== locales.length * themes.length) throw new Error(`Expected six mobile screenshots, captured ${reports.length}`);
  await writeFile(path.join(outputDir, 'report.json'), JSON.stringify({ screenshots: reports }, null, 2));
  console.log(`Captured ${reports.length} screenshots.`);
  console.log(`Outputs: ${outputDir}`);
} finally {
  await browser?.close();
  if (server && !server.killed) server.kill('SIGTERM');
}
