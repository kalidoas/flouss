import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { playHapticFeedback } from '../../utils/haptics';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showGrabber?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
  showGrabber = true,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState({ height: 0, keyboardInset: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Visual viewport tracking for mobile virtual keyboard avoidance
  useEffect(() => {
    if (!isOpen) return;

    const updateViewport = () => {
      const visualViewport = window.visualViewport;
      const height = visualViewport?.height || window.innerHeight;
      const keyboardInset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.offsetTop - visualViewport.height)
        : 0;
      setViewport({ height, keyboardInset });
    };

    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [isOpen]);

  // Lock body scroll, manage focus trap, and Escape key
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus trap implementation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        playHapticFeedback('light');
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto-focus first focusable element inside modal after open
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const firstInput = modalRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]), textarea, button[type="submit"], button'
        );
        if (firstInput && !firstInput.hasAttribute('autofocus')) {
          // If no autofocus was specified, keep smooth focus on container
        }
      }
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      const remainingOpen = document.querySelectorAll('[data-flouss-modal="open"]');
      if (remainingOpen.length <= 1) {
        document.body.style.overflow = originalOverflow || '';
      }
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const maxWidthStyles = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-2xl',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-flouss-modal="open"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden pointer-events-auto"
          style={{
            paddingBottom: viewport.keyboardInset ? `${viewport.keyboardInset}px` : undefined,
            boxSizing: 'border-box',
          }}
        >
          {/* Backdrop Blur + Dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md cursor-pointer"
            onClick={() => {
              playHapticFeedback('light');
              onClose();
            }}
          />

          {/* Modal / Sheet Panel */}
          <motion.div
            ref={modalRef}
            initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            style={{
              maxHeight: isMobile
                ? viewport.height
                  ? `${Math.min(viewport.height * 0.92, viewport.height - 24)}px`
                  : '90dvh'
                : '85vh',
            }}
            className={`relative w-full ${maxWidthStyles[maxWidth]} bg-surface text-content dark:bg-[#0A0A0C]/95 dark:text-white rounded-t-[28px] sm:rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.5)] border-t sm:border border-border-subtle dark:border-white/10 overflow-hidden z-10 flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Grabber */}
            {showGrabber && (
              <div className="sm:hidden pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none">
                <div className="w-10 h-1 rounded-full bg-muted/40 dark:bg-white/20" />
              </div>
            )}

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-border-subtle dark:border-white/10 shrink-0">
                <div className="min-w-0 pr-3 rtl:pr-0 rtl:pl-3">
                  {title && (
                    <h3 className="text-base font-semibold text-content dark:text-white tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-muted dark:text-zinc-400 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playHapticFeedback('light');
                    onClose();
                  }}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted hover:text-content hover:bg-surface-raised dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>

            {/* Optional Sticky Footer */}
            {footer && (
              <div className="sticky bottom-0 bg-surface/95 dark:bg-[#0A0A0C]/95 border-t border-border-subtle dark:border-white/10 px-4 sm:px-6 py-3 shrink-0 backdrop-blur-md">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
