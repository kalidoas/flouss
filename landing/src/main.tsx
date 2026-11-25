import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import Lenis from 'lenis';

function initLenis() {
  const lenis = new Lenis({
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

// Defer Lenis initialization until after initial paint to reduce TBT
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => requestIdleCallback(initLenis, { timeout: 2000 }), { once: true });
} else {
  requestIdleCallback(initLenis, { timeout: 2000 });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
