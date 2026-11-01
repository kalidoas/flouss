import React, { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate, HTMLMotionProps } from 'framer-motion';

export interface AppleGlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
  enableSpotlight?: boolean;
}

export const AppleGlassCard: React.FC<AppleGlassCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.22)',
  enableTilt = true,
  enableSpotlight = true,
  onClick,
  ...motionProps
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse coordinates for cursor-tracking spotlight border
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  // 3D Magnetic tilt values
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (enableSpotlight) {
      mouseX.set(x);
      mouseY.set(y);
    }

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Subtle 3D tilt: max 4 degrees
      const rotX = -((y - centerY) / centerY) * 3.5;
      const rotY = ((x - centerX) / centerX) * 3.5;
      rotateX.set(rotX);
      rotateY.set(rotY);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(-500);
    mouseY.set(-500);
    rotateX.set(0);
    rotateY.set(0);
  };

  // Cursor-tracking radial spotlight mask for specular 1px border highlight
  const spotlightBackground = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: 1200,
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 32,
        mass: 0.8,
      }}
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-shadow duration-300 ${className}`}
      {...motionProps}
    >
      {/* Dynamic Cursor-Tracking Spotlight Border Layer */}
      {enableSpotlight && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: spotlightBackground,
            maskImage: 'linear-gradient(black, black)',
            WebkitMaskImage: 'linear-gradient(black, black)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {children}
    </motion.div>
  );
};
