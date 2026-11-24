import React from 'react';
import { motion } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';
import { motionDurations, motionEasings } from './tokens';

export interface GaugeArcProps {
  value: number; // Current value (e.g. 65 or 0.65)
  max?: number; // Max value (default 100)
  size?: number; // Outer SVG size in px (default 120)
  strokeWidth?: number; // Stroke width in px (default 10)
  arcDegrees?: number; // Angular sweep: 240 for open gauge, 360 for full ring (default 240)
  trackColor?: string; // CSS color or token
  arcColor?: string; // Arc stroke color
  className?: string;
  children?: React.ReactNode; // Optional center label
}

export const GaugeArc: React.FC<GaugeArcProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  arcDegrees = 240,
  trackColor = 'var(--border, rgba(128,128,128,0.2))',
  arcColor = 'var(--accent, #6366f1)',
  className = '',
  children,
}) => {
  const prefersReducedMotion = useMotionPrefs();
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const clampedValue = Math.max(0, Math.min(value, max));
  const progressRatio = max > 0 ? clampedValue / max : 0;

  // Arc calculations
  const isFullCircle = arcDegrees >= 360;
  const totalCircumference = 2 * Math.PI * radius;
  const arcLength = (arcDegrees / 360) * totalCircumference;
  const strokeLength = arcLength * progressRatio;

  // Rotation offset so open gauge is centered at bottom
  const startRotation = isFullCircle ? -90 : 90 + (360 - arcDegrees) / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={isFullCircle ? undefined : `${arcLength} ${totalCircumference}`}
          transform={`rotate(${startRotation} ${center} ${center})`}
        />

        {/* Foreground active arc */}
        {prefersReducedMotion ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${strokeLength} ${totalCircumference}`}
            transform={`rotate(${startRotation} ${center} ${center})`}
          />
        ) : (
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${totalCircumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - strokeLength }}
            transition={{
              duration: motionDurations.slow,
              ease: motionEasings.easeOut,
            }}
            transform={`rotate(${startRotation} ${center} ${center})`}
          />
        )}
      </svg>

      {/* Center content slot */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};
