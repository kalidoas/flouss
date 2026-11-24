import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        content: 'var(--content)',
        text: 'var(--text)',
        muted: 'var(--text-muted)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        accent: 'var(--color-accent)',
        'accent-contrast': 'var(--accent-contrast)',
        positive: 'var(--color-positive)',
        negative: 'var(--color-negative)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        'info-contrast': 'var(--info-contrast)',
        ring: 'var(--ring)',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          'Inter',
          '"Plus Jakarta Sans"',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      fontSize: {
        caption: 'var(--font-caption)',
        body: 'var(--font-body)',
        strong: 'var(--font-strong)',
        section: 'var(--font-section)',
        hero: 'clamp(var(--font-hero-min), 4vw, var(--font-hero-max))',
      },
    },
  },
  plugins: [
    containerQueries,
  ],
};
