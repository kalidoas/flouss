import React from 'react';
import { motion } from 'framer-motion';
import { useMotionPrefs } from './useMotionPrefs';

export interface KineticHeadlineProps { before?: string; accent: string; after?: string; language?: 'en' | 'fr' | 'ar'; className?: string; }
export const KineticHeadline: React.FC<KineticHeadlineProps> = ({ before = '', accent, after = '', language = 'en', className = '' }) => {
  const reduced = useMotionPrefs();
  const content = <>{before && <>{before} </>}<span className={language === 'ar' ? 'text-accent-500' : 'font-serif italic text-accent-500'}>{accent}</span>{after && <> {after}</>}</>;
  return reduced ? <h1 className={className} dir={language === 'ar' ? 'rtl' : 'ltr'}>{content}</h1> : <motion.h1 className={className} dir={language === 'ar' ? 'rtl' : 'ltr'} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>{content}</motion.h1>;
};
