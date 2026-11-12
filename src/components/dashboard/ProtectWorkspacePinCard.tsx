import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Shield, KeyRound, X, ArrowRight } from 'lucide-react';

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

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="spotlight-card rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/40 p-4 sm:p-5 backdrop-blur-xl border border-indigo-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden mb-4 animate-in fade-in duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-indigo-500/20">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isAr
                ? 'احمِ مساحة عملك برمز PIN سري'
                : language === 'fr'
                ? 'Protégez votre espace avec un code PIN'
                : 'Protect your workspace with a PIN'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {isAr
                ? 'أضف طبقة أمان إضافية لقفل بياناتك المالية ومنع أي وصول غير مصرح به على هذا الجهاز.'
                : language === 'fr'
                ? 'Ajoutez une couche de sécurité pour verrouiller vos finances lors de vos prochaines visites.'
                : 'Add an extra security layer to lock your finances against unauthorized access on this device.'}
            </p>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onConfigurePin}
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer"
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
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
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
          className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
