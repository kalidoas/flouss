/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useNavigate, useLocation } from './react-router-dom';
import { useAppStore } from '../store/useAppStore';

describe('react-router-dom compatibility module', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    useAppStore.setState({ activeScreen: 'dashboard' });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('navigates to /income and updates activeScreen', async () => {
    let navigateFn: ReturnType<typeof useNavigate> | null = null;

    const TestComp = () => {
      navigateFn = useNavigate();
      return null;
    };

    await act(async () => {
      root.render(React.createElement(TestComp));
    });

    expect(navigateFn).toBeTypeOf('function');

    await act(async () => {
      navigateFn!('/income');
    });

    expect(useAppStore.getState().activeScreen).toBe('income');
  });

  it('navigates to /expenses and updates activeScreen', async () => {
    let navigateFn: ReturnType<typeof useNavigate> | null = null;

    const TestComp = () => {
      navigateFn = useNavigate();
      return null;
    };

    await act(async () => {
      root.render(React.createElement(TestComp));
    });

    await act(async () => {
      navigateFn!('/expenses');
    });

    expect(useAppStore.getState().activeScreen).toBe('expenses');
  });

  it('provides useLocation matching activeScreen', async () => {
    useAppStore.setState({ activeScreen: 'expenses' });
    let locationVal: ReturnType<typeof useLocation> | null = null;

    const TestComp = () => {
      locationVal = useLocation();
      return null;
    };

    await act(async () => {
      root.render(React.createElement(TestComp));
    });

    expect(locationVal ? (locationVal as any).pathname : '').toBe('/expenses');
  });
});
