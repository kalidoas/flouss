import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from '../../landing/node_modules/playwright/index.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const landingDir = path.resolve(scriptDir, '../../landing');
const outputDir = path.join(scriptDir, 'output');
const screenshotDir = path.join(outputDir, 'screenshots');
const videoDir = path.join(outputDir, 'videos');
const baseUrl = process.env.LANDING_URL || 'http://127.0.0.1:4173';
const locales = ['ar', 'fr', 'en'];
const themes = ['light', 'dark'];
const widths = [{ width: 390, height: 844 }, { width: 1280, height: 900 }];
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
await mkdir(videoDir, { recursive: true });
for (const file of await readdir(videoDir)) {
  if (file.startsWith('page@') && file.endsWith('.webm')) await unlink(path.join(videoDir, file));
}

let server;
let browser;

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

if (!process.env.LANDING_URL) {
  server = spawn(process.execPath, [path.join(landingDir, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: landingDir,
    stdio: 'ignore',
  });
}

try {
  await waitForServer(baseUrl);
  browser = await chromium.launch({ headless: true });
  const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await ogPage.goto(pathToFileURL(path.join(landingDir, 'public/images/og.svg')).href);
  await ogPage.screenshot({ path: path.join(landingDir, 'public/images/og.png') });
  await ogPage.close();

  for (const locale of locales) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
        recordVideo: { dir: videoDir, size: { width: 1280, height: 900 } },
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const localePath = locale === 'ar' ? '/' : `/${locale}/`;
      await page.goto(`${baseUrl}${localePath}`, { waitUntil: 'networkidle' });
      if (theme === 'dark') await page.locator('.theme-toggle').first().click();

      for (const viewport of widths) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
        if (viewport.width > 720) {
          await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
          await page.locator('.hero-flight.is-ready').waitFor({ state: 'attached', timeout: 5000 });
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await page.waitForTimeout(150);
        } else if ((await page.locator('.hero-flight').getAttribute('class'))?.includes('is-ready')) {
          throw new Error(`${locale}/${theme}: mobile should keep the static hero poster`);
        }
        await page.addStyleTag({
          content: '.intro-section, .features-section, .privacy-section, .closing-section, .footer { content-visibility: visible !important; contain-intrinsic-size: none !important; }',
        });
        const state = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          theme: document.querySelector('.site')?.getAttribute('data-theme'),
          width: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          cta: document.querySelector('.hero__actions .button')?.getAttribute('href'),
          colors: (() => {
            const site = document.querySelector('.site');
            const tokens = getComputedStyle(site);
            const button = getComputedStyle(document.querySelector('.hero__actions .button'));
            const icon = document.querySelector('.feature__icon--2');
            const iconStyle = getComputedStyle(icon);
            return {
              page: tokens.getPropertyValue('--page').trim(),
              text: tokens.getPropertyValue('--text').trim(),
              soft: tokens.getPropertyValue('--text-soft').trim(),
              muted: tokens.getPropertyValue('--text-muted').trim(),
              accent: tokens.getPropertyValue('--accent').trim(),
              buttonText: button.color,
              buttonSurface: button.backgroundColor,
              iconText: iconStyle.color,
              iconSurface: iconStyle.backgroundColor,
            };
          })(),
        }));
        if (state.lang !== locale) throw new Error(`${locale}/${theme}: expected lang=${locale}, got ${state.lang}`);
        if (state.dir !== (locale === 'ar' ? 'rtl' : 'ltr')) throw new Error(`${locale}/${theme}: wrong direction ${state.dir}`);
        if (state.theme !== theme) throw new Error(`${locale}/${theme}: expected theme=${theme}, got ${state.theme}`);
        if (state.width > state.viewport) throw new Error(`${locale}/${theme}/${viewport.width}: horizontal overflow ${state.width}px`);
        if (!state.cta?.startsWith('https://')) throw new Error(`${locale}/${theme}: CTA does not use a secure absolute URL`);
        for (const token of ['text', 'soft', 'muted', 'accent']) {
          const ratio = contrast(state.colors[token], state.colors.page);
          if (ratio < 4.5) throw new Error(`${locale}/${theme}: ${token} contrast is ${ratio.toFixed(2)}:1`);
        }
        if (contrast(state.colors.buttonText, state.colors.buttonSurface) < 4.5) {
          throw new Error(`${locale}/${theme}: primary CTA contrast is below 4.5:1`);
        }
        if (contrast(state.colors.iconText, state.colors.iconSurface) < 3) {
          throw new Error(`${locale}/${theme}: feature icon contrast is below 3:1`);
        }
        const screenshot = path.join(screenshotDir, `${locale}-${theme}-${viewport.width}.png`);
        await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
        reports.push({ locale, theme, viewport: viewport.width, screenshot, scene: await page.locator('.hero-flight').getAttribute('class'), ...state });
      }

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        const height = document.documentElement.scrollHeight;
        const steps = 24;
        for (let index = 0; index < steps; index += 1) {
          window.scrollTo(0, (height - window.innerHeight) * index / (steps - 1));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(150);
      const video = page.video();
      await context.close();
      const videoPath = path.join(videoDir, `${locale}-${theme}.webm`);
      await video.saveAs(videoPath);
      await video.delete();
      reports.push({ locale, theme, video: videoPath, errors: pageErrors });
      if (pageErrors.length) throw new Error(`${locale}/${theme}: ${pageErrors.join('; ')}`);
    }
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' });
  if ((await reducedPage.locator('.hero-flight').getAttribute('class'))?.includes('is-ready')) {
    throw new Error('Reduced-motion mode unexpectedly initialized the WebGL scene');
  }
  if (await reducedPage.locator('.hero-flight__poster').evaluate((image) => getComputedStyle(image).opacity) !== '1') {
    throw new Error('Reduced-motion mode did not retain the static poster');
  }
  await reducedContext.close();

  const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') return null;
      return originalGetContext.call(this, type, ...args);
    };
  });
  await fallbackPage.goto(baseUrl, { waitUntil: 'networkidle' });
  await fallbackPage.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
  await fallbackPage.waitForTimeout(500);
  if ((await fallbackPage.locator('.hero-flight').getAttribute('class'))?.includes('is-ready')) {
    throw new Error('The static poster fallback failed when WebGL2 was unavailable');
  }
  await fallbackContext.close();

  await writeFile(path.join(outputDir, 'report.json'), JSON.stringify(reports, null, 2));
  console.log(`Captured ${reports.filter((item) => item.screenshot).length} screenshots and ${reports.filter((item) => item.video).length} scroll videos.`);
  console.log(`Outputs: ${outputDir}`);
} finally {
  await browser?.close();
  if (server && !server.killed) server.kill('SIGTERM');
}
