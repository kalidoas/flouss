import React, { useRef, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Edit2 } from 'lucide-react';
import { playHapticFeedback, triggerHaptic } from '../../utils/haptics';
import { springs } from '../../utils/springs';
import { useAppStore } from '../../store/useAppStore';

export interface SwipeRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const SwipeRow: React.FC<SwipeRowProps> = ({
  children,
  onDelete,
  onEdit,
  className = '',
}) => {
  const { language } = useAppStore();
  const isRtl = language === 'ar';

  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState(false);
  const crossedRef = useRef(false);

  // Maximum drawer reveal distance (2 buttons ~ 140px, 1 button ~ 70px)
  const revealDistance = onEdit && onDelete ? 140 : 70;
  const dragMin = isRtl ? 0 : -revealDistance;
  const dragMax = isRtl ? revealDistance : 0;

  const handleDrag = (_: any, info: PanInfo) => {
    const rawOffset = info.offset.x;
    const swipeDistance = isRtl ? rawOffset : -rawOffset;

    if (swipeDistance >= revealDistance * 0.7 && !crossedRef.current) {
      crossedRef.current = true;
      triggerHaptic(40);
    } else if (swipeDistance < revealDistance * 0.7 && crossedRef.current) {
      crossedRef.current = false;
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const rawOffset = info.offset.x;
    const swipeDistance = isRtl ? rawOffset : -rawOffset;

    // Full velocity or deep drag (> 190px) triggers immediate delete
    if (swipeDistance > 190 && onDelete) {
      triggerHaptic(60);
      playHapticFeedback('error');
      onDelete();
      x.set(0);
      setIsOpen(false);
      return;
    }

    // Snap open if dragged past half the distance, otherwise snap shut
    if (swipeDistance > revealDistance * 0.5) {
      x.set(isRtl ? revealDistance : -revealDistance);
      setIsOpen(true);
    } else {
      x.set(0);
      setIsOpen(false);
    }
    crossedRef.current = false;
  };

  const closeDrawer = () => {
    x.set(0);
    setIsOpen(false);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl group ${className}`}>
      {/* Background Actions Underneath Item: revealed when swiping left */}
      <div
        className={`absolute inset-y-0 ${
          isRtl ? 'left-0 justify-start' : 'right-0 justify-end'
        } flex items-stretch z-0`}
        style={{ width: `${revealDistance}px` }}
      >
        {onEdit && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(40);
              closeDrawer();
              onEdit();
            }}
            aria-label={isRtl ? 'تعديل' : 'Edit'}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 px-3 text-[11px] font-semibold border-r border-white/[0.06]"
          >
            <Edit2 className="w-4 h-4 stroke-[2]" />
            <span>{isRtl ? 'تعديل' : 'Edit'}</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(50);
              playHapticFeedback('error');
              closeDrawer();
              onDelete();
            }}
            aria-label={isRtl ? 'حذف' : 'Delete'}
            className="flex-1 bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all text-white flex flex-col items-center justify-center gap-1 px-3 text-[11px] font-semibold"
          >
            <Trash2 className="w-4 h-4 stroke-[2]" />
            <span>{isRtl ? 'حذف' : 'Delete'}</span>
          </button>
        )}
      </div>

      {/* Foreground Swipeable Content */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: dragMin, right: dragMax }}
        dragElastic={0.18}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        transition={springs.snappy}
        className="relative z-10 touch-pan-y bg-[#0D0E14] will-change-transform w-full min-w-0"
      >
        {children}
      </motion.div>
    </div>
  );
};
