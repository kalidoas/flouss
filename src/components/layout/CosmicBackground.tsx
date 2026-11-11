import React, { useEffect, useRef } from 'react';

interface StarParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
  hasGlow: boolean;
  depth: number; // 0.2 (distant) to 1.0 (foreground) for 3D parallax
}

/**
 * CosmicBackground
 * Exact Zawa9-style living cosmic background with:
 * 1. Deep space void `#030308`
 * 2. Subtle breathing and drifting indigo / deep purple gradient mesh
 * 3. High-DPI canvas starfield with tiny, slow-drifting white and subtle-indigo star particles
 *    with varying opacities (0.1 to 0.8), gentle upward/lateral drift, and smooth 3D mouse parallax.
 */
export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = true;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // High-DPI Canvas scaling
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Track mouse for subtle Zawa9 parallax depth
    const handlePointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetParallaxX = (mouseX - width / 2) * 0.035;
      targetParallaxY = (mouseY - height / 2) * 0.035;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Pause RAF when document is in background
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !prefersReducedMotion) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Particle pool setup: 75 to 130 stars depending on screen real estate
    const particleCount = Math.min(130, Math.max(65, Math.floor((width * height) / 13000)));
    const colorPalette = [
      '#ffffff', // Pure white star (predominant)
      '#ffffff',
      '#ffffff',
      '#a5b4fc', // Soft Indigo
      '#c084fc', // Electric Violet
      '#93c5fd', // Ice Blue
      '#e0e7ff', // Pale Lavender
    ];

    const particles: StarParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const depth = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
      // 90% pinpoint tiny stars (0.45 - 1.2px), 10% slightly larger accent stars (1.3 - 1.7px)
      const isAccent = Math.random() < 0.12;
      const radius = isAccent ? Math.random() * 0.4 + 1.3 : Math.random() * 0.65 + 0.45;
      const baseAlpha = Math.random() * 0.55 + 0.18; // 0.18 to 0.73

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        // Gentle upward drift (-0.12 to -0.32 px/frame) and subtle lateral float
        vx: (Math.random() - 0.5) * 0.12 * depth,
        vy: -(Math.random() * 0.2 + 0.12) * depth,
        baseAlpha,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        hasGlow: isAccent || Math.random() < 0.15,
        depth,
      });
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      if (!isTabVisible) return;

      const delta = Math.min((now - lastTime) / 16.67, 2.5); // Normalize to 60fps
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Smooth damping for mouse parallax
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.twinklePhase += p.twinkleSpeed * delta;

          // Wrap-around screen bounds seamlessly
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          } else if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }

          if (p.x < -10) {
            p.x = width + 10;
          } else if (p.x > width + 10) {
            p.x = -10;
          }
        }

        // Calculate breathing opacity (oscillates gently between 0.10 and 0.82)
        const alphaShift = Math.sin(p.twinklePhase) * (p.baseAlpha * 0.42);
        const currentAlpha = Math.max(0.1, Math.min(0.85, p.baseAlpha + alphaShift));

        // Parallax coordinates
        const renderX = p.x + currentParallaxX * p.depth;
        const renderY = p.y + currentParallaxY * p.depth;

        ctx.beginPath();
        ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;

        if (p.hasGlow) {
          ctx.shadowBlur = 4 * p.depth;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-[#050505]"
      aria-hidden="true"
    >
      {/* ── Fixed Ambient Radial Gradient Glow (Zawaq Signature) ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(120, 0, 255, 0.12), transparent 70%)',
        }}
      />

      {/* ── Living Breathing Cosmic Gradient Mesh (Zawa9 Signature Nebulae) ── */}
      {/* Primary Central Indigo / Electric Violet Nebula */}
      <div
        className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full opacity-70 blur-[130px] animate-aurora-breathe pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(79, 70, 229, 0.17) 0%, rgba(124, 58, 237, 0.10) 45%, transparent 70%)',
        }}
      />

      {/* Mid-Right Violet / Purple Ambient Drift Nebula */}
      <div
        className="absolute top-[22%] -right-[12%] w-[680px] h-[680px] rounded-full opacity-60 blur-[140px] animate-aurora-drift pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 51, 234, 0.13) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
        }}
      />

      {/* Lower-Left Deep Midnight Blue Ambient Pool */}
      <div
        className="absolute top-[45%] -left-[12%] w-[620px] h-[620px] rounded-full opacity-55 blur-[125px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(30, 58, 138, 0.15) 0%, rgba(67, 56, 202, 0.08) 50%, transparent 70%)',
        }}
      />

      {/* Subtle Peripheral Vignette for infinite cosmic depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, transparent 45%, rgba(3, 3, 8, 0.55) 100%)',
        }}
      />

      {/* HTML5 High-DPI Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
    </div>
  );
};
