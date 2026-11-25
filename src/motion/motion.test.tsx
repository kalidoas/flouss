/**
 * @vitest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  motionDurations,
  motionEasings,
  motionSprings,
  motionTransitions,
  getPrefersReducedMotion,
  useMotionPrefs,
  AnimatedNumber,
  Pressable,
  GaugeArc,
  Reveal,
  Stagger,
  StaggerItem,
  DrawPath,
  SkeletonShimmer,
} from './index';

if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  window.IntersectionObserver = MockIntersectionObserver as any;
  (global as any).IntersectionObserver = MockIntersectionObserver as any;
}

describe('Motion Tokens Contract', () => {
  it('defines the required durations: 120, 200, 320, and 600ms', () => {
    expect(motionDurations.fast).toBe(0.12);
    expect(motionDurations.base).toBe(0.2);
    expect(motionDurations.medium).toBe(0.32);
    expect(motionDurations.slow).toBe(0.6);
    expect(motionDurations.fastMs).toBe(120);
    expect(motionDurations.baseMs).toBe(200);
    expect(motionDurations.mediumMs).toBe(320);
    expect(motionDurations.slowMs).toBe(600);
  });

  it('defines the required easings and springs', () => {
    expect(motionEasings.easeOut).toEqual([0.22, 1, 0.36, 1]);
    expect(motionEasings.easeInOut).toEqual([0.65, 0, 0.35, 1]);
    expect(motionSprings.default.stiffness).toBe(380);
    expect(motionSprings.default.damping).toBe(32);
  });
});

describe('useMotionPrefs & getPrefersReducedMotion', () => {
  it('returns false when window.matchMedia does not match reduce', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    expect(getPrefersReducedMotion()).toBe(false);
  });

  it('returns true when window.matchMedia matches (prefers-reduced-motion: reduce)', () => {
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
    expect(getPrefersReducedMotion()).toBe(true);
  });
});

describe('AnimatedNumber', () => {
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

  it('formats currency correctly in French and tabular-nums', async () => {
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
      root.render(<AnimatedNumber value={2500.5} language="fr" format="currency" />);
    });

    const text = container?.textContent?.replace(/[\s\u00A0\u202F]/g, ' ');
    expect(text).toContain('2 500,50 MAD');
    expect(container?.firstElementChild?.className).toContain('tabular-nums');
  });

  it('formats currency in Arabic with Dirham symbol', async () => {
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
      root.render(<AnimatedNumber value={1000} language="ar" format="currency" />);
    });

    const text = container?.textContent?.replace(/[\s\u00A0\u202F]/g, ' ');
    expect(text).toContain('1 000,00 د.م.');
  });

  it('supports percent and integer formats', async () => {
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
      root.render(
        <div>
          <AnimatedNumber value={42} format="percent" className="percent-num" />
          <AnimatedNumber value={120} format="integer" unit="days" className="integer-num" />
        </div>
      );
    });

    const text = container?.textContent?.replace(/[\s\u00A0\u202F]/g, ' ');
    expect(text).toContain('42%');
    expect(text).toContain('120 days');
  });

  it('applies privacy-blur when hide is true', async () => {
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
      root.render(<AnimatedNumber value={500} hide={true} />);
    });

    expect(container?.firstElementChild?.className).toContain('privacy-blur');
  });
});

describe('Pressable', () => {
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

  it('renders button with click handling', async () => {
    const handleClick = vi.fn();
    const root = createRoot(container!);
    await act(async () => {
      root.render(<Pressable onClick={handleClick}>Action</Pressable>);
    });

    const button = container?.querySelector('button');
    expect(button).not.toBeNull();
    button?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', async () => {
    const handleClick = vi.fn();
    const root = createRoot(container!);
    await act(async () => {
      root.render(<Pressable disabled onClick={handleClick}>Disabled</Pressable>);
    });

    const button = container?.querySelector('button');
    expect(button?.disabled).toBe(true);
    button?.click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('GaugeArc', () => {
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

  it('renders SVG with track and active circle under reduced motion', async () => {
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
      root.render(
        <GaugeArc value={75} max={100} size={140}>
          <span>75%</span>
        </GaugeArc>
      );
    });

    const svg = container?.querySelector('svg');
    expect(svg).not.toBeNull();
    const circles = container?.querySelectorAll('circle');
    expect(circles?.length).toBe(2); // 1 track + 1 active
    expect(container?.textContent).toContain('75%');
  });
});

describe('Reveal and Stagger under prefers-reduced-motion', () => {
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

  it('renders regular static DOM elements when reduced motion is requested', async () => {
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
      root.render(
        <Reveal className="test-reveal">
          <Stagger className="test-stagger">
            <StaggerItem className="test-item">Item 1</StaggerItem>
          </Stagger>
        </Reveal>
      );
    });

    expect(container?.querySelector('.test-reveal')).not.toBeNull();
    expect(container?.querySelector('.test-stagger')).not.toBeNull();
    expect(container?.querySelector('.test-item')).not.toBeNull();
    expect(container?.textContent).toContain('Item 1');
  });
});

describe('DrawPath and SkeletonShimmer', () => {
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

  it('DrawPath renders path under reduced motion', async () => {
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
      root.render(
        <svg>
          <DrawPath d="M 0 0 L 100 100" />
        </svg>
      );
    });

    const path = container?.querySelector('path');
    expect(path?.getAttribute('d')).toBe('M 0 0 L 100 100');
  });

  it('SkeletonShimmer renders accessible placeholder', async () => {
    const root = createRoot(container!);
    await act(async () => {
      root.render(<SkeletonShimmer width={100} height={20} className="custom-skeleton" />);
    });

    const skeleton = container?.querySelector('.custom-skeleton');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
  });
});
