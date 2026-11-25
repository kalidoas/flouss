import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';

export interface SpringSheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const SpringSheet: React.FC<SpringSheetProps> = ({ open, onClose, label, children, className = '' }) => {
  const reduced = useMotionPrefs();
  return <AnimatePresence>
    {open && <motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.section role="dialog" aria-modal="true" aria-label={label} className={`w-full max-w-xl rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl ${className}`} initial={reduced ? false : { y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? undefined : { y: 32, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />{children}
      </motion.section>
    </motion.div>}
  </AnimatePresence>;
};
