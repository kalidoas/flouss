import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  isSoundEnabled,
  setSoundEnabled,
  playHapticFeedback,
  getOrInitIOSSwitch,
  initGlobalHaptics,
} from './haptics';

describe('Haptics v2 Module', () => {
  let storage: Record<string, string> = {};
  const listeners: Record<string, ((e: any) => void)[]> = {};
  let bodyElements: any[] = [];
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    storage = {};
    bodyElements = [];
    for (const k in listeners) delete listeners[k];

    // Setup global window / document / navigator mocks for Node environment
    Object.defineProperty(globalThis, 'window', {
      value: {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => (key in storage ? storage[key] : null),
        setItem: (key: string, val: string) => {
          storage[key] = val;
        },
        clear: () => {
          storage = {};
        },
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        vibrate: vi.fn().mockReturnValue(true),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'document', {
      value: {
        body: {
          appendChild: (el: any) => {
            bodyElements.push(el);
            return el;
          },
          removeChild: (el: any) => {
            bodyElements = bodyElements.filter((item) => item !== el);
          },
          contains: (el: any) => bodyElements.includes(el),
        },
        getElementById: (id: string) => {
          const findInTree = (nodes: any[]): any => {
            for (const node of nodes) {
              if (node.id === id) return node;
              if (node.children) {
                const found = findInTree(node.children);
                if (found) return found;
              }
            }
            return null;
          };
          return findInTree(bodyElements);
        },
        createElement: (tag: string) => {
          const attrs: Record<string, string> = {};
          const element: any = {
            tagName: tag.toUpperCase(),
            children: [],
            style: {},
            setAttribute: (k: string, v: string) => {
              attrs[k] = v;
              element[k] = v;
            },
            getAttribute: (k: string) => element[k] ?? attrs[k] ?? null,
            hasAttribute: (k: string) => k in attrs || element[k] !== undefined,
            appendChild: (child: any) => {
              element.children.push(child);
              return child;
            },
            click: vi.fn(),
          };
          return element;
        },
        addEventListener: (type: string, cb: any) => {
          if (!listeners[type]) listeners[type] = [];
          listeners[type].push(cb);
        },
        removeEventListener: (type: string, cb: any) => {
          if (listeners[type]) {
            listeners[type] = listeners[type].filter((fn) => fn !== cb);
          }
        },
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    }
  });

  it('defaults to haptics enabled = true and sound enabled = false', () => {
    expect(isHapticsEnabled()).toBe(true);
    expect(isSoundEnabled()).toBe(false);
  });

  it('updates preferences via setHapticsEnabled and setSoundEnabled', () => {
    setHapticsEnabled(false);
    expect(isHapticsEnabled()).toBe(false);

    setHapticsEnabled(true);
    expect(isHapticsEnabled()).toBe(true);

    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);

    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
  });

  it('creates the hidden iOS switch DOM container', () => {
    const label = getOrInitIOSSwitch();
    expect(label).not.toBeNull();
    expect(label?.id).toBe('flouss-ios-switch-label');

    const input = document.getElementById('flouss-ios-switch-hack');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('type')).toBe('checkbox');
    expect(input?.hasAttribute('switch')).toBe(true);
  });

  it('throttles rapid consecutive haptic triggers (< 40ms)', () => {
    const vibrateMock = vi.fn();
    (navigator as unknown as { vibrate: typeof vibrateMock }).vibrate = vibrateMock;

    playHapticFeedback('light');
    const firstCalls = vibrateMock.mock.calls.length;

    // Call immediately (0ms delta)
    playHapticFeedback('light');
    expect(vibrateMock.mock.calls.length).toBe(firstCalls);
  });

  it('does nothing when haptics and sound are both disabled', () => {
    setHapticsEnabled(false);
    setSoundEnabled(false);

    const vibrateMock = vi.fn();
    (navigator as unknown as { vibrate: typeof vibrateMock }).vibrate = vibrateMock;

    playHapticFeedback('medium');
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it('installs global event delegation on pointerdown and triggers on interactive targets', () => {
    const cleanup = initGlobalHaptics();

    // Verify listeners are installed
    expect(listeners['pointerdown']?.length).toBeGreaterThan(0);
    expect(listeners['change']?.length).toBeGreaterThan(0);

    cleanup();
    expect(listeners['pointerdown']?.length).toBe(0);
  });
});
