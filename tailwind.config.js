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
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--border)',
        'border-subtle': 'var(--border)',
        'border-strong': 'var(--border-strong)',
        content: 'var(--color-content)',
        text: 'var(--text)',
        muted: 'var(--color-muted)',
        'text-muted': 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'accent-contrast': 'var(--accent-contrast)',
        positive: 'var(--color-positive)',
        negative: 'var(--color-negative)',
        ring: 'var(--ring)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
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
