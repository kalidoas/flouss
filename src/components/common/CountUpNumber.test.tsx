/**
 * @vitest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CountUpNumber } from './CountUpNumber';

describe('CountUpNumber - prefers-reduced-motion', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
    vi.restoreAllMocks();
  });

  it('immediately sets target value without animation when prefers-reduced-motion is true', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const root = createRoot(container!);
    await act(async () => {
      root.render(<CountUpNumber value={1500} language="en" duration={1000} />);
    });

    const text = container?.textContent?.replace(/[\s\u00A0\u202F]/g, ' ');
    expect(text).toContain('1 500');
    expect(text).toContain('MAD');
  });
});
