import React from 'react';

export const Coin3DScene: React.FC<{ className?: string }> = ({ className = '' }) => <div className={`flouss-balance-scene ${className}`} aria-hidden="true">
  <div className="flouss-balance-orbit flouss-balance-orbit-back" />
  <div className="flouss-balance-orbit flouss-balance-orbit-front" />
  <div className="flouss-balance-coin"><div className="flouss-balance-coin-face"><span className="flouss-balance-coin-mark">د.م.</span><span className="flouss-balance-coin-stars">✦　✦　✦</span></div></div>
  <div className="flouss-balance-scene-shadow" />
</div>;
