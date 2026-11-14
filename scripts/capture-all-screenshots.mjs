import fs from 'node:fs';
import path from 'node:path';

const outDir = '/home/khalid/.gemini/antigravity/brain/570eca51-1a63-43a0-b66f-c3b39efaf6c6/screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('Connecting to Chrome...');
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  console.log('WebSocket target:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data.result);
      }
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);
  console.log('Connected to CDP session.');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // Wait for page load
  console.log('Navigating to app...');
  await send('Page.navigate', { url: 'http://localhost:4173/' });
  await new Promise((r) => setTimeout(r, 2000));

  // Initialize store state to authenticated demo app
  console.log('Configuring store state...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.useAppStore) {
          const store = window.useAppStore.getState();
          window.useAppStore.setState({
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
              language: 'en',
              currency: 'MAD'
            }
          });
          return true;
        }
        return false;
      })()
    `,
    returnByValue: true
  });

  await new Promise((r) => setTimeout(r, 1000));

  const scenarios = [
    // Dashboard
    { screen: 'dashboard', theme: 'light', width: 360, height: 780, sidebar: false, name: 'dashboard-light-360px' },
    { screen: 'dashboard', theme: 'dark', width: 360, height: 780, sidebar: false, name: 'dashboard-dark-360px' },
    { screen: 'dashboard', theme: 'light', width: 1280, height: 800, sidebar: false, name: 'dashboard-light-1280px-sidebar-open' },
    { screen: 'dashboard', theme: 'light', width: 1280, height: 800, sidebar: true, name: 'dashboard-light-1280px-sidebar-closed' },
    { screen: 'dashboard', theme: 'dark', width: 1280, height: 800, sidebar: false, name: 'dashboard-dark-1280px-sidebar-open' },
    { screen: 'dashboard', theme: 'dark', width: 1280, height: 800, sidebar: true, name: 'dashboard-dark-1280px-sidebar-closed' },

    // Program (Tasks)
    { screen: 'tasks', theme: 'light', width: 360, height: 780, sidebar: false, name: 'program-light-360px' },
    { screen: 'tasks', theme: 'dark', width: 360, height: 780, sidebar: false, name: 'program-dark-360px' },
    { screen: 'tasks', theme: 'light', width: 1280, height: 800, sidebar: false, name: 'program-light-1280px-sidebar-open' },
    { screen: 'tasks', theme: 'light', width: 1280, height: 800, sidebar: true, name: 'program-light-1280px-sidebar-closed' },
    { screen: 'tasks', theme: 'dark', width: 1280, height: 800, sidebar: false, name: 'program-dark-1280px-sidebar-open' },
    { screen: 'tasks', theme: 'dark', width: 1280, height: 800, sidebar: true, name: 'program-dark-1280px-sidebar-closed' },

    // Settings
    { screen: 'settings', theme: 'light', width: 360, height: 780, sidebar: false, name: 'settings-light-360px' },
    { screen: 'settings', theme: 'dark', width: 360, height: 780, sidebar: false, name: 'settings-dark-360px' },
    { screen: 'settings', theme: 'light', width: 1280, height: 800, sidebar: false, name: 'settings-light-1280px-sidebar-open' },
    { screen: 'settings', theme: 'light', width: 1280, height: 800, sidebar: true, name: 'settings-light-1280px-sidebar-closed' },
    { screen: 'settings', theme: 'dark', width: 1280, height: 800, sidebar: false, name: 'settings-dark-1280px-sidebar-open' },
    { screen: 'settings', theme: 'dark', width: 1280, height: 800, sidebar: true, name: 'settings-dark-1280px-sidebar-closed' },
  ];

  for (const s of scenarios) {
    console.log(`Capturing: ${s.name} (${s.width}x${s.height})...`);

    // 1. Set emulation metrics (viewport)
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.width,
      height: s.height,
      deviceScaleFactor: 1,
      mobile: s.width < 768,
    });

    // 2. Set state in app
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.useAppStore) {
            window.useAppStore.setState({
              activeScreen: '${s.screen}',
              theme: '${s.theme}',
              isDarkMode: ${s.theme === 'dark'},
              sidebarCollapsed: ${s.sidebar}
            });
            if ('${s.theme}' === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        })()
      `,
    });

    await new Promise((r) => setTimeout(r, 600));

    // 3. Capture screenshot
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(outDir, `${s.name}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved: ${filePath}`);
  }

  console.log('All screenshots captured successfully!');
  ws.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
