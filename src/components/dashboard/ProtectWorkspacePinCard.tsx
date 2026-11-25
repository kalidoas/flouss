import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Reveal } from '../../motion';

interface Props {
  onConfigurePin: () => void;
}

export const ProtectWorkspacePinCard: React.FC<Props> = ({ onConfigurePin }) => {
  const { firebaseUser, userProfile, language } = useAppStore();
  const uid = firebaseUser?.uid;
  const isAr = language === 'ar';

  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    if (!uid) return;
    const isDismissed = localStorage.getItem(`flouss_dismiss_pin_card_${uid}`) === 'true';
    const hasPin = Boolean(userProfile?.hasPin);
    setDismissed(isDismissed || hasPin);
  }, [uid, userProfile?.hasPin]);

  const handleDismiss = () => {
    if (uid) {
      try {
        localStorage.setItem(`flouss_dismiss_pin_card_${uid}`, 'true');
      } catch {}
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  const handleEnable = () => {
    onConfigurePin();
    handleDismiss();
  };

  return (
    <Reveal
      className="mb-4"
      delay={0}
      yOffset={8}
    >
      <div
        data-testid="pin-onboarding-checklist"
        dir={isAr ? 'rtl' : 'ltr'}
        className="spotlight-card rounded-2xl bg-surface dark:bg-surface-3/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-border-subtle/10 shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden min-w-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 border border-accent-500/30 text-accent-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-accent/30">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-content dark:text-content tracking-tight">
                {isAr
                  ? 'قائمة التحقق المبدئية'
                  : language === 'fr'
                  ? 'Checklist de bienvenue'
                  : 'Getting started checklist'}
              </h3>
              <p className="text-xs text-muted dark:text-muted mt-1 leading-relaxed">
                {isAr
                  ? 'إكمال هذه الخطوات سيمنحك حماية PIN وتتبع الرصيد المبدئي.'
                  : language === 'fr'
                  ? 'Complétez ces étapes pour activer la protection PIN et le suivi du solde initial.'
                  : 'Complete these steps to enable PIN protection and starting-balance tracking.'}
              </p>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleEnable}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-content hover:bg-surface text-accent-contrast text-xs font-bold transition-all shadow-md shadow-accent/30 active:scale-95 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>
                    {isAr ? 'تفعيل رمز PIN' : language === 'fr' ? 'Activer le code PIN' : 'Enable PIN'}
                  </span>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs text-muted hover:text-content transition-colors"
                >
                  {isAr ? 'تجاهل' : language === 'fr' ? 'Plus tard' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="p-1 rounded-lg text-muted hover:text-content hover:bg-surface-raised/80 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Reveal>
  );
};
