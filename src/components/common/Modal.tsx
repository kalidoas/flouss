import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      const remainingOpen = document.querySelectorAll('[data-flouss-modal="open"]');
      if (remainingOpen.length <= 1) {
        document.body.style.overflow = '';
      }
    }

    return () => {
      const remainingOpen = document.querySelectorAll('[data-flouss-modal="open"]');
      if (remainingOpen.length <= 1) {
        document.body.style.overflow = '';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-flouss-modal="open"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          {/* Backdrop with black/60 and backdrop-blur-md */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[#050505]/80 backdrop-blur-2xl cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Panel with Apple Spring Physics */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full ${maxWidthStyles[maxWidth]} bg-[#0A0A0C]/95 backdrop-blur-2xl rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden z-10 max-h-[85vh] sm:max-h-[88vh] flex flex-col text-white`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="px-6 py-4.5 flex items-start justify-between border-b border-white/10 shrink-0">
                <div>
                  {title && (
                    <h3 className="text-base font-medium text-white tracking-tight">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
