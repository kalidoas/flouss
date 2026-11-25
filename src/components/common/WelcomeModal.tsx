import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Sparkles, TrendingUp, ArrowRight, X } from 'lucide-react';
import { KineticHeadline } from '../../motion/KineticHeadline';

export const WelcomeModal: React.FC = () => {
  const { firebaseUser, language, markWelcomeSeen, authGate } = useAppStore();
  const t = translations[language].welcome;
  const isAr = language === 'ar';

  const handleDismiss = async () => {
    await markWelcomeSeen();
  };

  const handleContinueSetup = async () => {
    await markWelcomeSeen();
  };

  // Only render when in welcome authGate state or explicitly active
  if (authGate !== 'welcome') return null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="w-full max-w-sm rounded-[28px] bg-surface/95 border border-border p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Ambient Glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none rounded-full opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(circle, bg-accent, bg-positive)' }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1 rounded-full text-text-subtle hover:text-content hover:bg-surface-2 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 border border-border flex items-center justify-center text-positive mb-4 shadow-lg">
          <Sparkles className="w-7 h-7" />
        </div>

        {/* Title & Description */}
        <KineticHeadline language={language} accent={t.title} className="text-lg font-bold tracking-tight text-content mb-1.5" />
        <p className="text-xs text-text-subtle leading-relaxed mb-6">
          {t.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleContinueSetup}
            className="w-full py-3 px-4 rounded-full bg-surface text-text-subtle font-bold text-xs flex items-center justify-center gap-2 hover:bg-border-border transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 duration-200 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-positive" />
            <span>{t.cta}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-full bg-surface-3 hover:bg-surface-2 border border-border text-xs font-semibold text-muted hover:text-content transition-all cursor-pointer"
          >
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
};
