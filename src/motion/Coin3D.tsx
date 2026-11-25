import React, { Suspense, lazy } from 'react';
import { useMotionPrefs } from './useMotionPrefs';

const Coin3DScene = lazy(() => import('./Coin3DScene').then((module) => ({ default: module.Coin3DScene })));
const StaticCoin: React.FC<{ className?: string }> = ({ className = '' }) => <div className={`flouss-balance-scene flouss-coin-static ${className}`} aria-hidden="true"><div className="flouss-balance-coin"><div className="flouss-balance-coin-face"><span className="flouss-balance-coin-mark">د.م.</span><span className="flouss-balance-coin-stars">✦　✦　✦</span></div></div></div>;

export const Coin3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduced = useMotionPrefs();
  const touchDevice = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches);
  if (reduced || touchDevice) return <StaticCoin className={className} />;
  return <Suspense fallback={<StaticCoin className={className} />}><Coin3DScene className={className} /></Suspense>;
};
