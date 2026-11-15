/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardAiWidget } from './DashboardAiWidget';
import { Category, Transaction } from '../../types';

describe('DashboardAiWidget', () => {
  const uid = 'test_user_widget';
  const categories: Category[] = [
    { id: 'cat_food', name: 'Food', icon: 'Utensils', color: '#f00', isDefault: true, createdAt: '2026-01-01' },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders a dismissible onboarding tip (never styled as insight) when transactions.length < 3', () => {
    // 0 transactions: onboarding tip rendered, never styled as insight
    const htmlEmpty = renderToStaticMarkup(
      <DashboardAiWidget transactions={[]} categories={categories} language="en" uid={uid} />
    );
    expect(htmlEmpty).not.toContain('ai-insight-card');
    expect(htmlEmpty).not.toContain('Flouss Insights');
    expect(htmlEmpty).toContain('getting-started-tip');
    expect(htmlEmpty).toContain('Getting started');
    expect(htmlEmpty).toContain('Record at least 3 transactions');

    // 2 transactions: still onboarding tip, no AI insight card
    const twoTxs: Transaction[] = [
      { id: '1', type: 'expense', categoryId: 'cat_food', amount: 10, date: '2026-11-01', createdAt: '2026-11-01' },
      { id: '2', type: 'expense', categoryId: 'cat_food', amount: 20, date: '2026-11-02', createdAt: '2026-11-02' },
    ];
    const htmlTwo = renderToStaticMarkup(
      <DashboardAiWidget transactions={twoTxs} categories={categories} language="en" uid={uid} />
    );
    expect(htmlTwo).not.toContain('ai-insight-card');
    expect(htmlTwo).not.toContain('Flouss Insights');
    expect(htmlTwo).toContain('getting-started-tip');

    // After dismiss in localStorage, neither tip nor insight is rendered
    localStorage.setItem(`flouss_dismiss_getting_started_${uid}`, 'true');
    const htmlDismissed = renderToStaticMarkup(
      <DashboardAiWidget transactions={twoTxs} categories={categories} language="en" uid={uid} />
    );
    expect(htmlDismissed).toBe('');
  });

  it('renders the AI insight card when transactions.length >= 3', () => {
    const threeTxs: Transaction[] = [
      { id: '1', type: 'expense', categoryId: 'cat_food', amount: 10, date: '2026-11-01', createdAt: '2026-11-01' },
      { id: '2', type: 'expense', categoryId: 'cat_food', amount: 20, date: '2026-11-02', createdAt: '2026-11-02' },
      { id: '3', type: 'expense', categoryId: 'cat_food', amount: 30, date: '2026-11-03', createdAt: '2026-11-03' },
    ];

    const html = renderToStaticMarkup(
      <DashboardAiWidget transactions={threeTxs} categories={categories} language="en" uid={uid} />
    );
    expect(html).not.toContain('getting-started-tip');
    expect(html).toContain('ai-insight-card');
    expect(html).toContain('Flouss Insights');
  });
});
