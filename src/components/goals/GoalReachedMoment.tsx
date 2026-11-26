import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, Sparkles } from 'lucide-react';
import { Category } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Money } from '../common/Money';
import { Button } from '../common/Button';
import { getCategoryName } from '../../utils/i18nHelpers';
import { translations } from '../../i18n/translations';
import { useMotionMode, useMotionPrefs } from '../../motion/useMotionPrefs';

interface GoalReachedMomentProps {
  category: Category | null;
  isOpen: boolean;
  onContinue: () => void;
}

export const GoalReachedMoment: React.FC<GoalReachedMomentProps> = ({ category, isOpen, onContinue }) => {
  const language = useAppStore((state) => state.language);
  const t = translations[language].categories;
  const reducedMotion = useMotionPrefs();
  const motionMode = useMotionMode();

  useEffect(() => {
    if (!isOpen || reducedMotion || motionMode !== 'full') return;
    try {
      confetti({ particleCount: 70, spread: 58, origin: { y: 0.62 }, disableForReducedMotion: true });
    } catch {
      // The confirmation remains complete without the optional visual effect.
    }
  }, [isOpen, reducedMotion, motionMode]);

  if (!category) return null;

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-3 text-center">
      {reducedMotion || motionMode !== 'full' ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-positive/15 text-positive" aria-hidden="true">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-positive/15 text-positive"
          aria-hidden="true"
        >
          <Sparkles className="h-8 w-8" />
        </motion.div>
      )}
      <p className="max-w-sm text-sm text-muted">
        {t.goalReachedMessage.replace('{goal}', getCategoryName(category, language))}
      </p>
      <p className="text-2xl font-bold tabular-nums text-positive">
        <Money amount={category.targetAmount || 0} />
      </p>
      <Button type="button" onClick={onContinue} className="w-full sm:w-auto">
        {t.goalReachedAction}
      </Button>
    </div>
  );
};
