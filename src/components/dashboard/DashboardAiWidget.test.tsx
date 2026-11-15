/**
 * @vitest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DashboardAiWidget } from './DashboardAiWidget';
import { Transaction, Category } from '../../types';

describe('DashboardAiWidget', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  const mockCategories: Category[] = [
    { id: 'cat_food', name: 'Food', icon: 'Utensils', color: '#f00', isGoal: false, isArchived: false, createdAt: '2026-01-01' },
  ];

  it('renders dismissible onboarding tip (NOT styled as an AI insight) when transactions < 3', async () => {
    const fewTransactions: Transaction[] = [
      { id: 'tx_1', amount: 50, type: 'expense', date: '2026-02-01', createdAt: '2026-02-01', categoryId: 'cat_food' },
      { id: 'tx_2', amount: 30, type: 'expense', date: '2026-02-02', createdAt: '2026-02-02', categoryId: 'cat_food' },
    ];

    const root = createRoot(container!);
    await act(async () => {
      root.render(
        <DashboardAiWidget
          transactions={fewTransactions}
          categories={mockCategories}
          language="en"
          uid="test_user"
        />
      );
    });

    const tip = container!.querySelector('[data-testid="getting-started-tip"]');
    expect(tip).not.toBeNull();

    const insight = container!.querySelector('[data-testid="ai-insight-card"]');
    expect(insight).toBeNull();
  });

  it('renders AI insight card when transactions >= 3', async () => {
    const enoughTransactions: Transaction[] = [
      { id: 'tx_1', amount: 50, type: 'expense', date: '2026-02-01', createdAt: '2026-02-01', categoryId: 'cat_food' },
      { id: 'tx_2', amount: 30, type: 'expense', date: '2026-02-02', createdAt: '2026-02-02', categoryId: 'cat_food' },
      { id: 'tx_3', amount: 70, type: 'expense', date: '2026-02-03', createdAt: '2026-02-03', categoryId: 'cat_food' },
    ];

    const root = createRoot(container!);
    await act(async () => {
      root.render(
        <DashboardAiWidget
          transactions={enoughTransactions}
          categories={mockCategories}
          language="en"
          uid="test_user"
        />
      );
    });

    const insight = container!.querySelector('[data-testid="ai-insight-card"]');
    expect(insight).not.toBeNull();

    const tip = container!.querySelector('[data-testid="getting-started-tip"]');
    expect(tip).toBeNull();
  });
});
