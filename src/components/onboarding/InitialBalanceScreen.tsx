import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Wallet, ArrowRight, Sparkles, Check, DollarSign } from 'lucide-react';
import { Money } from '../common/Money';

export const InitialBalanceScreen: React.FC = () => {
  const { language, completeInitialBalance, skipInitialBalance } = useAppStore();
  const isAr = language === 'ar';

  const [amountStr, setAmountStr] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const quickPills = [2000, 5000, 10000, 20000, 35000];

  const handleAmountChange = (val: string) => {
    setError('');
    // Replace comma with dot and remove disallowed characters
    const clean = val.replace(/,/g, '.').replace(/[^\d.]/g, '');
    // Allow at most one decimal point
    const parts = clean.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return; // at most 2 decimals
    setAmountStr(clean);
  };

  const parseNumericAmount = (): number => {
    if (!amountStr.trim()) return 0;
    const n = parseFloat(amountStr);
    return isNaN(n) ? 0 : n;
  };

  const handleContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amount = parseNumericAmount();
    if (amount < 0) {
      setError(
        isAr
          ? 'يرجى إدخال مبلغ صحيح (≥ 0 د.م.)'
          : language === 'fr'
          ? 'Veuillez saisir un montant valide (≥ 0 MAD)'
          : 'Please enter a valid amount (≥ 0 MAD)'
      );
      return;
    }

    setSubmitting(true);
    try {
      await completeInitialBalance(amount);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l’enregistrement');
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await skipInitialBalance();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du passage');
      setSubmitting(false);
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-bg text-accent-contrast flex items-center justify-center p-4 sm:p-6 font-sans select-none relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, bg-accent, bg-positive)' }}
      />

      <div className="w-full max-w-md rounded-3xl bg-surface/95 border border-border/10 p-6 sm:p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative z-10 animate-in fade-in zoom-in-95 duration-300">

        {/* Wallet Icon with subtle glow */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-accent/20 to-positive/20 border border-border/10 flex items-center justify-center text-positive mb-5 shadow-lg shadow-md">
          <Wallet className="w-8 h-8" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-accent-contrast tracking-tight mb-2">
          {isAr
            ? 'ما هو رصيدك المالي الحالي؟'
            : language === 'fr'
            ? 'Quel est votre solde actuel ?'
            : 'What is your current balance?'}
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xs mx-auto mb-6">
          {isAr
            ? 'أدخل المبلغ المتوفر لديك حالياً لبدء تتبع دقيق لأموالك، أو تخطَّ هذه الخطوة للبدء برصيد 0.'
            : language === 'fr'
            ? 'Indiquez l’argent dont vous disposez aujourd’hui pour démarrer un suivi précis de vos finances.'
            : 'Enter the funds you currently have available to start tracking your finances accurately.'}
        </p>

        <form onSubmit={handleContinue} className="space-y-5">
          {/* Amount input card */}
          <div className="p-4 rounded-2xl bg-surface/[0.03] border border-border/10 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-ring/20 transition-all">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
              {isAr ? 'الرصيد المتاح' : language === 'fr' ? 'Solde disponible' : 'Available balance'}
            </label>
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full text-center text-3xl sm:text-4xl font-extrabold tracking-tight bg-transparent text-accent-contrast placeholder:text-muted outline-none tabular-nums"
              />
              <span className="text-sm sm:text-base font-bold text-positive shrink-0">
                {isAr ? 'د.م.' : 'MAD'}
              </span>
            </div>
          </div>

          {/* Quick selection pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setAmountStr(String(pill))}
                className="py-1 px-3 rounded-full bg-surface/[0.04] hover:bg-surface/[0.08] border border-border/10 hover:border-border/20 text-xs font-semibold text-muted hover:text-accent-contrast transition-all active:scale-95 cursor-pointer tabular-nums"
              >
                <Money amount={pill} className="tabular-nums" />
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-negative font-medium bg-negative/10 py-2 px-3 rounded-xl border border-negative/20">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-full bg-surface text-text font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-surface-2 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-95 duration-200 cursor-pointer disabled:opacity-50"
            >
              <span>{isAr ? 'متابعة' : language === 'fr' ? 'Continuer' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSkip}
              className="w-full py-2 px-4 rounded-full text-xs font-medium text-muted hover:text-muted transition-colors cursor-pointer"
            >
              {isAr
                ? 'تخطي الآن (بدء برصيد 0)'
                : language === 'fr'
                ? 'Passer pour l’instant (démarrer à 0)'
                : 'Skip for now (start at 0)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
