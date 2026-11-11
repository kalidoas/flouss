import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Sparkles, TrendingUp, ArrowRight, X } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const { firebaseUser, isOnboarded, language } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language].welcome;
  const isAr = language === 'ar';

  useEffect(() => {
    if (!firebaseUser?.uid || !isOnboarded) {
      setIsOpen(false);
      return;
    }

    const key = `flouss_welcome_${firebaseUser.uid}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      setIsOpen(true);
    }
  }, [firebaseUser?.uid, isOnboarded]);

  const markSeen = () => {
    if (firebaseUser?.uid) {
      localStorage.setItem(`flouss_welcome_${firebaseUser.uid}`, 'true');
    }
    setIsOpen(false);
  };

  const handleAddFirstIncome = () => {
    markSeen();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'income' } }));
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="w-full max-w-sm rounded-[28px] bg-[#0D0E14]/95 border border-white/10 p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Ambient Glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none rounded-full opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(circle, #6366f1, #10b981)' }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={markSeen}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-emerald-400 mb-4 shadow-lg">
          <Sparkles className="w-7 h-7" />
        </div>

        {/* Title & Description */}
        <h2 className="text-lg font-bold text-white tracking-tight mb-1.5">
          {t.title}
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          {t.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleAddFirstIncome}
            className="w-full py-3 px-4 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 duration-200 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{t.cta}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>

          <button
            type="button"
            onClick={markSeen}
            className="w-full py-2.5 px-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
};
