import { useState, useCallback, useRef, useEffect } from 'react';

export interface MouseCoordinates {
  x: number;
  y: number;
}

/**
 * useMousePosition
 * Card-level hook for Zawa9-style interactive spotlight hover.
 * Updates CSS variables `--x` and `--y` on the element style directly
 * to power radial-gradient spotlights that track the user's cursor with zero react re-renders.
 */
export function useMousePosition<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [coordinates, setCoordinates] = useState<MouseCoordinates>({ x: -9999, y: -9999 });

  const onMouseMove = useCallback((e: React.MouseEvent<T> | MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ref.current.style.setProperty('--x', `${x}px`);
    ref.current.style.setProperty('--y', `${y}px`);
    setCoordinates({ x, y });
  }, []);

  const onMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (ref.current) {
      ref.current.style.setProperty('--x', '-9999px');
      ref.current.style.setProperty('--y', '-9999px');
    }
    setCoordinates({ x: -9999, y: -9999 });
  }, []);

  return {
    ref,
    isHovered,
    coordinates,
    bind: {
      ref,
      onMouseMove,
      onMouseEnter,
      onMouseLeave,
    },
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  };
}

/**
 * useGlobalSpotlightTracker
 * Global window pointer tracker that finds any `.spotlight-card` or `[data-spotlight="true"]`
 * under the cursor and sets `--x` and `--y` coordinates via requestAnimationFrame.
 * This guarantees all Bento cards across all pages receive follow-cursor glow without manual binding.
 */
export function useGlobalSpotlightTracker() {
  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    let rafId: number | null = null;
    let activeCard: HTMLElement | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const target = e.target as HTMLElement | null;
        if (!target) return;

        const card = target.closest?.('.spotlight-card, [data-spotlight="true"]') as HTMLElement | null;

        if (card) {
          if (activeCard && activeCard !== card) {
            activeCard.style.setProperty('--x', '-9999px');
            activeCard.style.setProperty('--y', '-9999px');
          }
          activeCard = card;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--x', `${x}px`);
          card.style.setProperty('--y', `${y}px`);
        } else if (activeCard) {
          activeCard.style.setProperty('--x', '-9999px');
          activeCard.style.setProperty('--y', '-9999px');
          activeCard = null;
        }
      });
    };

    const handlePointerLeave = () => {
      if (activeCard) {
        activeCard.style.setProperty('--x', '-9999px');
        activeCard.style.setProperty('--y', '-9999px');
        activeCard = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}
