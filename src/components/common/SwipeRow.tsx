import React, { useRef, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { playHapticFeedback } from '../../utils/haptics';
import { springs } from '../../utils/springs';
import { useAppStore } from '../../store/useAppStore';

export interface SwipeRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onSecondaryAction?: () => void;
  secondaryIcon?: React.ReactNode;
  secondaryLabel?: string;
  secondaryColor?: string;
  className?: string;
}

export const SwipeRow: React.FC<SwipeRowProps> = ({
  children,
  onDelete,
  onSecondaryAction,
  secondaryIcon,
  secondaryLabel,
  secondaryColor = 'bg-emerald-600',
  className = '',
}) => {
  const { language } = useAppStore();
  const isRtl = language === 'ar';

  const x = useMotionValue(0);
  const [hasCrossedThreshold, setHasCrossedThreshold] = useState(false);
  const crossedRef = useRef(false);

  // Background action opacity and scale transforms
  const deleteOpacity = useTransform(x, isRtl ? [20, 80] : [-20, -80], [0, 1]);
  const deleteScale = useTransform(x, isRtl ? [20, 80] : [-20, -80], [0.7, 1]);

  const secondaryOpacity = useTransform(x, isRtl ? [-20, -80] : [20, 80], [0, 1]);
  const secondaryScale = useTransform(x, isRtl ? [-20, -80] : [20, 80], [0.7, 1]);

  const handleDrag = (_: any, info: PanInfo) => {
    const rawOffset = info.offset.x;
    const deleteOffset = isRtl ? rawOffset : -rawOffset;

    if (deleteOffset >= 80 && !crossedRef.current) {
      crossedRef.current = true;
      setHasCrossedThreshold(true);
      playHapticFeedback('rigid');
    } else if (deleteOffset < 80 && crossedRef.current) {
      crossedRef.current = false;
      setHasCrossedThreshold(false);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const rawOffset = info.offset.x;
    const deleteOffset = isRtl ? rawOffset : -rawOffset;
    const secondaryOffset = isRtl ? -rawOffset : rawOffset;

    // Full swipe (> 180px) triggers immediate delete
    if (deleteOffset > 180 && onDelete) {
      playHapticFeedback('error');
      onDelete();
    } else if (secondaryOffset > 180 && onSecondaryAction) {
      playHapticFeedback('success');
      onSecondaryAction();
    }

    crossedRef.current = false;
    setHasCrossedThreshold(false);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Background Actions Layer */}
      <div className="absolute inset-0 flex items-center justify-between select-none pointer-events-none">
        {/* Secondary Action (Left in LTR, Right in RTL) */}
        {onSecondaryAction ? (
          <motion.div
            style={{ opacity: secondaryOpacity, scale: secondaryScale }}
            className={`h-full px-5 flex items-center gap-2 text-white font-bold text-xs ${secondaryColor} ${
              isRtl ? 'order-last justify-end' : 'justify-start'
            }`}
          >
            {secondaryIcon}
            {secondaryLabel && <span>{secondaryLabel}</span>}
          </motion.div>
        ) : (
          <div />
        )}

        {/* Delete Destructive Action (Right in LTR, Left in RTL) */}
        {onDelete && (
          <motion.div
            style={{ opacity: deleteOpacity, scale: deleteScale }}
            className={`h-full px-5 flex items-center gap-1.5 text-white font-bold text-xs bg-rose-600 ${
              isRtl ? 'order-first justify-start' : 'justify-end'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </motion.div>
        )}
      </div>

      {/* Foreground Swipeable Content */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        transition={springs.snappy}
        className="relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};
