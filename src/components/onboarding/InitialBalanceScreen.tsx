import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Tags } from 'lucide-react';
import { Money } from '../common/Money';
import { KineticHeadline } from '../../motion/KineticHeadline';
import { Coin3D } from '../../motion/Coin3D';

type SetupStep = 'balance' | 'budget' | 'pin';

export const InitialBalanceScreen: React.FC = () => {
  const { language, completeInitialBalance, categories, updateCategory, setProfilePin } = useAppStore();
  const isAr = language === 'ar';
  const [step, setStep] = useState<SetupStep>('balance');
  const [amountStr, setAmountStr] = useState<string>('');
  const [budgetStr, setBudgetStr] = useState('');
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirmation, setPinConfirmation] = useState('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const quickPills = [2000, 5000, 10000, 20000, 35000];
  const copy = translations[language].onboarding;

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
      setError(copy.invalidAmount);
      return;
    }

    setStep('budget');
  };

  const finishSetup = async () => {
    setSubmitting(true);
    setError('');
    const budget = Number.parseFloat(budgetStr.replace(/\s/g, '').replace(',', '.')) || 0;
    if (pin && (pin.length !== 4 || pin !== pinConfirmation)) {
      setError(pin.length !== 4 ? copy.pinHint : copy.pinMismatch);
      setSubmitting(false);
      return;
    }
    try {
      if (budget > 0 && budgetCategoryId) updateCategory(budgetCategoryId, { monthlyBudget: budget });
      if (pin.length === 4) await setProfilePin(pin);
      await completeInitialBalance(parseNumericAmount());
    } catch {
      setError(copy.setupError);
      setSubmitting(false);
    }
  };

  const titles: Record<SetupStep, string> = { balance: copy.balanceStep, budget: copy.budgetStep, pin: copy.pinStep };
  const stepIndex = ['balance', 'budget', 'pin'].indexOf(step);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-bg text-content flex items-center justify-center p-4 sm:p-6 font-sans select-none relative overflow-hidden"
    >
      <div className="w-full max-w-lg rounded-[30px] bg-surface border border-border-subtle p-6 sm:p-9 text-center shadow-xl relative z-10">

        {/* Wallet Icon with subtle glow */}
        <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-raised text-accent-600">
          {step === 'balance' ? <Coin3D className="flouss-onboarding-coin" /> : step === 'budget' ? <Tags className="w-7 h-7" /> : <LockKeyhole className="w-7 h-7" />}
        </div>

        <KineticHeadline language={language} accent={titles[step]} className="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-content" />
        <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-muted">
          {step === 'balance' ? copy.question : step === 'budget' ? copy.budgetHint : copy.pinHint}
        </p>
        <div className="mb-6 flex justify-center gap-2" aria-label={`${stepIndex + 1}/3`}>
          {(['balance', 'budget', 'pin'] as SetupStep[]).map((item, index) => <span key={item} className={`h-1.5 rounded-full transition-all ${item === step ? 'w-8 bg-accent-600' : index < stepIndex ? 'w-5 bg-positive' : 'w-5 bg-border-strong'}`} />)}
        </div>

        {step === 'balance' && <>
        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xs mx-auto mb-6">{copy.hint}</p>
        <form onSubmit={handleContinue} className="space-y-5">
          {/* Amount input card */}
          <div className="p-4 rounded-2xl bg-surface/[0.03] border border-border/10 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-ring/20 transition-all">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
              {copy.availableBalance}
            </label>
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder={copy.enterAmountPlaceholder}
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full text-center text-3xl sm:text-4xl font-extrabold tracking-tight bg-transparent text-accent-contrast placeholder:text-muted outline-none tabular-nums"
              />
              <span className="text-sm sm:text-base font-bold text-positive shrink-0">
                MAD
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
              <span>{copy.continue}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => { setAmountStr('0'); setError(''); setStep('budget'); }}
              className="w-full py-2 px-4 rounded-full text-xs font-medium text-muted hover:text-muted transition-colors cursor-pointer"
            >
              {copy.skipBalance}
            </button>
          </div>
        </form>
        </>}

        {step === 'budget' && <div className="space-y-4 text-start">
          <label className="block text-xs font-semibold text-muted">{copy.budgetLabel}
            <select value={budgetCategoryId} onChange={(event) => setBudgetCategoryId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-border-subtle bg-surface-raised px-3 text-sm text-content">
              <option value="">{copy.skip}</option>
              {categories.filter((category) => !category.isGoal && !category.isArchived).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-muted">{copy.budgetAmount}
            <div className="mt-2 flex items-center rounded-xl border border-border-subtle bg-surface-raised px-4 focus-within:ring-2 focus-within:ring-accent-500/30">
              <input value={budgetStr} onChange={(event) => setBudgetStr(event.target.value.replace(/[^\d.,]/g, ''))} inputMode="decimal" placeholder="0" className="min-h-12 w-full bg-transparent text-base text-content outline-none" />
              <span className="text-xs text-muted">MAD</span>
            </div>
          </label>
          {error && <p role="alert" className="text-sm text-negative">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep('balance')} className="min-h-12 flex-1 rounded-full border border-border-subtle text-sm font-semibold text-content"><ArrowLeft className="me-2 inline h-4 w-4 rtl:rotate-180" />{copy.back}</button>
            <button type="button" onClick={() => { setError(''); setStep('pin'); }} className="min-h-12 flex-1 rounded-full bg-accent-600 text-sm font-semibold text-white">{copy.next}<ArrowRight className="ms-2 inline h-4 w-4 rtl:rotate-180" /></button>
          </div>
          <button type="button" onClick={() => { setBudgetStr(''); setBudgetCategoryId(''); setStep('pin'); }} className="min-h-10 w-full text-sm text-muted">{copy.skip}</button>
        </div>}

        {step === 'pin' && <div className="space-y-4 text-start">
          <label className="block text-xs font-semibold text-muted">{copy.pinLabel}
            <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} autoComplete="new-password" placeholder="••••" className="mt-2 min-h-12 w-full rounded-xl border border-border-subtle bg-surface-raised px-4 text-center text-lg tracking-[.5em] text-content" />
          </label>
          {pin.length > 0 && <label className="block text-xs font-semibold text-muted">{copy.confirmPin}
            <input type="password" inputMode="numeric" maxLength={4} value={pinConfirmation} onChange={(event) => setPinConfirmation(event.target.value.replace(/\D/g, '').slice(0, 4))} autoComplete="new-password" placeholder="••••" className="mt-2 min-h-12 w-full rounded-xl border border-border-subtle bg-surface-raised px-4 text-center text-lg tracking-[.5em] text-content" />
          </label>}
          {error && <p role="alert" className="text-sm text-negative">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" disabled={submitting} onClick={() => setStep('budget')} className="min-h-12 flex-1 rounded-full border border-border-subtle text-sm font-semibold text-content"><ArrowLeft className="me-2 inline h-4 w-4 rtl:rotate-180" />{copy.back}</button>
            <button type="button" disabled={submitting} onClick={() => void finishSetup()} className="min-h-12 flex-1 rounded-full bg-accent-600 text-sm font-semibold text-white disabled:opacity-50">{submitting ? <Check className="mx-auto h-5 w-5" /> : copy.finish}</button>
          </div>
          {!pin && <button type="button" disabled={submitting} onClick={() => void finishSetup()} className="min-h-10 w-full text-sm text-muted">{copy.skip}</button>}
        </div>}
      </div>
    </div>
  );
};
