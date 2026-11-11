import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { springs } from '../../utils/springs';
import { playHapticFeedback } from '../../utils/haptics';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
  showGrabber?: boolean;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[88vh]',
  showGrabber = true,
  className = '',
}) => {
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 300], [0.6, 0.1]);

  // Lock body scroll while open & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playHapticFeedback('light');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Dismiss if dragged down with velocity > 400 or offset > 160px
    if (info.velocity.y > 400 || info.offset.y > 160) {
      playHapticFeedback('light');
      onClose();
    } else {
      // Snapped back up
      if (info.offset.y > 40) {
        playHapticFeedback('selection');
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] flex items-end justify-center pointer-events-auto"
        >
          {/* Backdrop with drag-reactive opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ opacity: backdropOpacity }}
            onClick={() => {
              playHapticFeedback('light');
              onClose();
            }}
            className="fixed inset-0 bg-[#050505]/80 backdrop-blur-2xl cursor-pointer"
          />

          {/* Bottom Sheet Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            style={{ y: dragY }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            transition={springs.sheet}
            className={`relative w-full max-w-md ${maxHeight} overflow-hidden bg-[#0A0A0C]/95 backdrop-blur-2xl text-white rounded-t-[2.25rem] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-t border-white/10 flex flex-col z-10 safe-area-bottom pb-safe pb-8 ${className}`}
          >
            {/* Grabber Bar */}
            {showGrabber && (
              <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none">
                <motion.div
                  whileTap={{ scaleX: 1.15, scaleY: 0.85 }}
                  className="w-10 h-1.5 rounded-full bg-white/20"
                />
              </div>
            )}

            {/* Header (optional) */}
            {(title || subtitle) && (
              <div className="px-6 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="min-w-0 pr-4">
                  {title && (
                    <h3 className="font-medium text-base text-white tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
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
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
