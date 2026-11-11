/**
 * @vitest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuickAddButton } from './QuickAddButton';
import { useAppStore } from '../../store/useAppStore';

// @ts-expect-error test act environment setup
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('QuickAddButton', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    useAppStore.setState({ language: 'en' });
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
    // Clean up any portal elements in body
    const portals = document.querySelectorAll('.fixed.bottom-6.end-6');
    portals.forEach((el) => el.parentElement?.remove());
  });

  it('renders the FAB button into document.body with z-[9999]', async () => {
    const root = createRoot(container!);
    await act(async () => {
      root.render(<QuickAddButton />);
    });

    const fab = document.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
    expect(fab).not.toBeNull();
    expect(fab?.className).toContain('z-[9999]');
  });

  it('toggles the action menu when clicked', async () => {
    const root = createRoot(container!);
    await act(async () => {
      root.render(<QuickAddButton />);
    });

    const fab = document.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
    expect(fab).not.toBeNull();
    expect(fab.getAttribute('aria-expanded')).toBe('false');

    // Click FAB to open menu
    await act(async () => {
      fab.click();
    });

    expect(fab.getAttribute('aria-expanded')).toBe('true');
    // Backdrop and menu panel should be present in document.body
    const expenseBtn = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Expense')
    );
    expect(expenseBtn).toBeDefined();

    // Click FAB again to close
    await act(async () => {
      fab.click();
    });

    expect(fab.getAttribute('aria-expanded')).toBe('false');
  });

  it('triggers onAddExpense when clicking Add Expense in menu', async () => {
    const handleAddExpense = vi.fn();
    const root = createRoot(container!);

    await act(async () => {
      root.render(<QuickAddButton onAddExpense={handleAddExpense} />);
    });

    const fab = document.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
    await act(async () => {
      fab.click();
    });

    const expenseBtn = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Expense')
    );
    expect(expenseBtn).toBeDefined();

    await act(async () => {
      expenseBtn?.click();
    });

    expect(handleAddExpense).toHaveBeenCalledTimes(1);
    expect(fab.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes menu when Escape key is pressed', async () => {
    const root = createRoot(container!);
    await act(async () => {
      root.render(<QuickAddButton />);
    });

    const fab = document.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
    await act(async () => {
      fab.click();
    });
    expect(fab.getAttribute('aria-expanded')).toBe('true');

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(fab.getAttribute('aria-expanded')).toBe('false');
  });
});
