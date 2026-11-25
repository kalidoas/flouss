import React, { Suspense, lazy } from 'react';
import { useMotionPrefs } from './useMotionPrefs';

const Coin3DScene = lazy(() => import('./Coin3DScene').then((module) => ({ default: module.Coin3DScene })));
const StaticCoin = () => <div className="flouss-balance-scene" aria-hidden="true"><div className="flouss-balance-coin"><div className="flouss-balance-coin-face"><span className="flouss-balance-coin-mark">د.م.</span><span className="flouss-balance-coin-stars">✦　✦　✦</span></div></div></div>;

export const Coin3D: React.FC = () => {
  const reduced = useMotionPrefs();
  if (reduced) return <StaticCoin />;
  return <Suspense fallback={<StaticCoin />}><Coin3DScene /></Suspense>;
};
