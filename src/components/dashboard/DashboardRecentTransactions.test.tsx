/**
 * @vitest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DashboardRecentTransactions } from './DashboardRecentTransactions';
import { useAppStore } from '../../store/useAppStore';
import { Transaction, Category } from '../../types';

describe('DashboardRecentTransactions', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const mockCategory: Category = {
      id: 'food',
      name: 'Food',
      key: 'food',
      icon: 'Utensils',
      color: '#f97316',
      isGoal: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    useAppStore.setState({
      language: 'ar',
      categories: [mockCategory],
      incomeSources: [],
    });
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  it('renders a strict vertical flex stack without multi-column grid classes', async () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 50,
        type: 'expense',
        categoryId: 'food',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        note: 'وجبات سريعة وخفيفة',
      },
      {
        id: 'tx-2',
        amount: 100,
        type: 'expense',
        categoryId: 'food',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        note: 'قهوة وشاي',
      },
    ];

    const root = createRoot(container!);
    await act(async () => {
      root.render(
        <DashboardRecentTransactions transactions={mockTransactions} onViewAll={() => {}} />
      );
    });

    // Verify container uses vertical flex layout
    const stackContainer = container!.querySelector('.flex.flex-col.gap-3');
    expect(stackContainer).not.toBeNull();

    // Ensure no grid-cols-2 or md:grid-cols-2 are present in the list container
    expect(container!.querySelector('.grid-cols-2')).toBeNull();
    expect(container!.querySelector('.md\\:grid-cols-2')).toBeNull();

    // Verify both items are present in vertical stack
    expect(container!.textContent).toContain('وجبات سريعة وخفيفة');
    expect(container!.textContent).toContain('قهوة وشاي');
  });
});
