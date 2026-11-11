import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'left' | 'right' | 'auto';
  matchTriggerWidth?: boolean;
  className?: string;
  minWidth?: number;
  offsetY?: number;
}

export const DropdownPortal: React.FC<DropdownPortalProps> = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  align = 'auto',
  matchTriggerWidth = false,
  className = '',
  minWidth,
  offsetY = 6,
}) => {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width?: number;
    maxHeight?: number;
    placeAbove?: boolean;
  }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const gap = offsetY;
    const spaceBelow = viewportHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    const menuEl = menuRef.current;
    const menuHeight = menuEl ? menuEl.offsetHeight : 240;
    const placeAbove = spaceBelow < Math.min(menuHeight, 200) && spaceAbove > spaceBelow;

    let top: number | undefined;
    let bottom: number | undefined;
    let maxHeight: number;

    if (placeAbove) {
      bottom = viewportHeight - rect.top + gap;
      maxHeight = Math.max(120, spaceAbove - 16);
    } else {
      top = rect.bottom + gap;
      maxHeight = Math.max(120, spaceBelow - 16);
    }

    let left: number | undefined;
    let right: number | undefined;
    let width: number | undefined;

    const isRtl = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';
    const menuWidth = menuEl ? menuEl.offsetWidth : (minWidth ?? 220);

    if (matchTriggerWidth) {
      left = Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8));
      width = rect.width;
    } else {
      let effectiveAlign = align;
      if (effectiveAlign === 'auto') {
        const triggerCenter = rect.left + rect.width / 2;
        effectiveAlign = triggerCenter > viewportWidth / 2 ? 'end' : 'start';
      }

      if (effectiveAlign === 'end') {
        if (isRtl) {
          left = Math.max(8, rect.left);
          if (left + menuWidth > viewportWidth - 8) {
            left = Math.max(8, viewportWidth - menuWidth - 8);
          }
        } else {
          right = Math.max(8, viewportWidth - rect.right);
          if (viewportWidth - right - menuWidth < 8) {
            right = undefined;
            left = 8;
          }
        }
      } else if (effectiveAlign === 'start') {
        if (isRtl) {
          right = Math.max(8, viewportWidth - rect.right);
          if (viewportWidth - right - menuWidth < 8) {
            right = undefined;
            left = 8;
          }
        } else {
          left = Math.max(8, rect.left);
          if (left + menuWidth > viewportWidth - 8) {
            left = Math.max(8, viewportWidth - menuWidth - 8);
          }
        }
      } else if (effectiveAlign === 'right') {
        right = Math.max(8, viewportWidth - rect.right);
        if (viewportWidth - right - menuWidth < 8) {
          right = undefined;
          left = 8;
        }
      } else if (effectiveAlign === 'left') {
        left = Math.max(8, rect.left);
        if (left + menuWidth > viewportWidth - 8) {
          left = Math.max(8, viewportWidth - menuWidth - 8);
        }
      }
    }

    setCoords({
      top,
      bottom,
      left,
      right,
      width,
      maxHeight,
      placeAbove,
    });
  }, [align, matchTriggerWidth, minWidth, offsetY, triggerRef]);

  // Update position on mount and whenever trigger dimensions change
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      // Re-run in next frame once menu is mounted so actual offsetWidth/offsetHeight are measured
      const raf = requestAnimationFrame(() => {
        updatePosition();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen, updatePosition]);

  // Update on scroll & resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollResize, { passive: true });
    window.addEventListener('scroll', handleScrollResize, { capture: true, passive: true });

    return () => {
      window.removeEventListener('resize', handleScrollResize);
      window.removeEventListener('scroll', handleScrollResize, { capture: true });
    };
  }, [isOpen, updatePosition]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Global click-outside invisible backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />

          {/* Root Portal Dropdown Menu Container */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: coords.placeAbove ? -6 : 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: coords.placeAbove ? -4 : 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              zIndex: 9999,
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: coords.left !== undefined ? `${coords.left}px` : undefined,
              right: coords.right !== undefined ? `${coords.right}px` : undefined,
              width: coords.width !== undefined ? `${coords.width}px` : undefined,
              maxHeight: coords.maxHeight !== undefined ? `${coords.maxHeight}px` : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
            className={className}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
