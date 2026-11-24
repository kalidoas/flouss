import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Share, PlusSquare, Smartphone, Check, Sparkles } from 'lucide-react';

interface AddToHomeScreenModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AddToHomeScreenModal: React.FC<AddToHomeScreenModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}) => {
  const { language } = useAppStore();
  const tNotif = translations[language].notifications;
  const isAr = language === 'ar';

  const [internalIsOpen, setInternalIsOpen] = useState(false);

  useEffect(() => {
    const handleTrigger = () => {
      setInternalIsOpen(true);
    };
    window.addEventListener('flouss:show-add-to-home-screen', handleTrigger);
    return () => {
      window.removeEventListener('flouss:show-add-to-home-screen', handleTrigger);
    };
  }, []);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    }
    setInternalIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={tNotif.addToHomeScreenTitle}
      subtitle={tNotif.addToHomeScreenSubtitle}
      maxWidth="md"
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Apple PWA Notice */}
        <div className="p-3.5 rounded-2xl bg-info/10 border border-info/20 text-info dark:text-info flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-info/20 text-info dark:text-info flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="leading-relaxed">
            <p className="font-bold text-xs text-info dark:text-info">
              {isAr ? 'متطلب أمان نظام Apple iOS' : 'Exigence système Apple iOS'}
            </p>
            <p className="text-[11px] text-info/80 dark:text-info/80 mt-0.5">
              {isAr
                ? 'لا يسمح متصفح Safari على iPhone بتفعيل إشعارات الويب إلا بعد إضافة التطبيق إلى الشاشة الرئيسية.'
                : 'Safari sur iPhone requiert que l’application soit ajoutée à l’écran d’accueil pour activer les notifications push.'}
            </p>
          </div>
        </div>

        {/* 3 Simple Steps */}
        <div className="space-y-2.5">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-surface-3 dark:bg-surface/50 border border-border/[0.05] dark:border-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-border-border dark:bg-surface-2 text-content dark:text-content flex items-center justify-center shrink-0 font-bold">
              <Share className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-content dark:text-content text-xs">
                {tNotif.addToHomeScreenStep1Title}
              </h4>
              <p className="text-[11px] text-text-subtle dark:text-text-subtle leading-relaxed">
                {tNotif.addToHomeScreenStep1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-surface-3 dark:bg-surface/50 border border-border/[0.05] dark:border-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-border-border dark:bg-surface-2 text-content dark:text-content flex items-center justify-center shrink-0 font-bold">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-content dark:text-content text-xs">
                {tNotif.addToHomeScreenStep2Title}
              </h4>
              <p className="text-[11px] text-text-subtle dark:text-text-subtle leading-relaxed">
                {tNotif.addToHomeScreenStep2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-surface-3 dark:bg-surface/50 border border-border/[0.05] dark:border-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-positive/15 text-positive dark:text-positive border border-positive/20 flex items-center justify-center shrink-0 font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-content dark:text-content text-xs">
                {tNotif.addToHomeScreenStep3Title}
              </h4>
              <p className="text-[11px] text-text-subtle dark:text-text-subtle leading-relaxed">
                {tNotif.addToHomeScreenStep3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Got it action button */}
        <div className="pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={handleClose}
            className="flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{tNotif.addToHomeScreenConfirm}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
