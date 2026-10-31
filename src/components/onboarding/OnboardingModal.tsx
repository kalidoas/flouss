import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { formatMAD } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Coins,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

type OnboardingStep = 'pin' | 'balance';

export const OnboardingModal: React.FC = () => {
  const { isOnboarded, lockInitialBalance, language, firebaseUser } = useAppStore();
  const t = translations[language].onboarding;
  const isAr = language === 'ar';

  const [step, setStep] = useState<OnboardingStep>('pin');

  // Step 1: Security PIN (4 digits - optional)
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');

  // Step 2: Starting Balance
  const [balanceVal, setBalanceVal] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (isOnboarded) return null;

  // --- Step 1: Handle PIN Pad Input ---
  const handlePinDigit = (digit: string) => {
    setError('');
    if (pinStep === 'create') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          setTimeout(() => setPinStep('confirm'), 200);
        }
      }
    } else {
      if (pinConfirm.length < 4) {
        const next = pinConfirm + digit;
        setPinConfirm(next);
        if (next.length === 4) {
          if (next === pin) {
            setTimeout(() => setStep('balance'), 250);
          } else {
            setError(
              isAr
                ? 'الرمز التأكيدي غير متطابق، حاول مجدداً'
                : 'Les deux codes PIN ne correspondent pas'
            );
            setTimeout(() => {
              setPinConfirm('');
            }, 600);
          }
        }
      }
    }
  };

  const handlePinDelete = () => {
    setError('');
    if (pinStep === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setPinConfirm((prev) => prev.slice(0, -1));
    }
  };

  const handleSkipPin = () => {
    setPin('');
    setPinConfirm('');
    setStep('balance');
  };

  // --- Step 2: Submit Starting Balance ---
  const numericAmount = parseFloat(balanceVal.replace(/\s/g, '').replace(',', '.')) || 0;

  const executeLockBalance = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await lockInitialBalance(numericAmount, {
        email: firebaseUser?.email || '',
        pinCode: pin.length === 4 ? pin : undefined,
        accountName: firebaseUser?.displayName || 'Principal',
      });
      setShowConfirmModal(false);
    } catch (err: any) {
      setError(
        err?.message ||
          (isAr
            ? 'حدث خطأ أثناء حفظ الرصيد، يرجى المحاولة مجدداً'
            : 'Erreur lors de l’enregistrement du solde')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numericAmount) || numericAmount < 0) {
      setError(
        isAr
          ? 'يرجى إدخال مبلغ صحيح (≥ 0 د.م.)'
          : 'Veuillez entrer un montant valide (≥ 0 MAD)'
      );
      return;
    }
    executeLockBalance();
  };

  const quickPills = [2000, 5000, 10000, 20000, 35000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#e3e2de] dark:border-[#2f2f2f] text-center relative overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header & Step Tracker */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#e3e2de] dark:border-[#2f2f2f]">
          <Logo size="md" showWordmark={true} />
          <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {step === 'pin' ? '1' : '2'}
            </span>
            <span>/</span>
            <span>2</span>
          </div>
        </div>

        {/* ================= STEP 1: Security PIN Setup ================= */}
        {step === 'pin' && (
          <div className="space-y-4">
            <div>
              <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center mb-2.5">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#37352f] dark:text-[#ecebed]">
                {pinStep === 'create'
                  ? isAr
                    ? 'حدد رمز PIN السري لحماية حسابك (4 أرقام)'
                    : 'Définissez votre code PIN secret (4 chiffres)'
                  : isAr
                  ? 'أكد رمز PIN السري'
                  : 'Confirmez votre code PIN'}
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-1 leading-relaxed">
                {isAr
                  ? 'سيُطلب هذا الرمز عند تسجيل الدخول لحماية خصوصية بياناتك المالية.'
                  : 'Ce code protège l’accès à vos finances après la connexion.'}
              </p>
            </div>

            {/* 4 Dots indicator */}
            <div className="flex justify-center gap-3.5 py-3">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinStep === 'create' ? idx < pin.length : idx < pinConfirm.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                      isFilled
                        ? 'bg-emerald-600 border-emerald-600 scale-110 shadow-xs'
                        : 'border-[#e3e2de] dark:border-[#3f3f3f] bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[230px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="h-11 rounded-xl bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-all cursor-pointer active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (pinStep === 'confirm') {
                    setPinStep('create');
                    setPinConfirm('');
                  }
                }}
                className="h-11 rounded-xl text-xs text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] flex items-center justify-center transition-colors cursor-pointer"
              >
                {pinStep === 'confirm' ? <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> : null}
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="h-11 rounded-xl bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-all cursor-pointer active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinDelete}
                className="h-11 rounded-xl text-xs text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] flex items-center justify-center transition-colors cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Skip option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSkipPin}
                className="text-xs text-[#787774] hover:text-[#37352f] dark:hover:text-[#ecebed] underline transition-colors cursor-pointer"
              >
                {isAr ? 'تخطي إعداد PIN في الوقت الحالي' : 'Passer cette étape (configurer plus tard)'}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Initial Balance Setup ================= */}
        {step === 'balance' && (
          <div className="space-y-4 text-left">
            <div>
              <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center mb-2.5">
                <Coins className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#37352f] dark:text-[#ecebed] text-center">
                {t.question}
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-1 text-center leading-relaxed">
                {t.hint}
              </p>
            </div>

            <form onSubmit={handleBalanceSubmit} className="space-y-3.5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  placeholder="0,00"
                  value={balanceVal}
                  onChange={(e) => {
                    setBalanceVal(e.target.value);
                    setError('');
                  }}
                  className="w-full text-2xl font-bold py-3 px-3.5 rounded-xl border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:border-emerald-600 outline-none transition-all pr-16 tabular-nums shadow-xs"
                />
                <span className="absolute right-3 text-xs font-bold text-[#787774] bg-[#f1f0ee] dark:bg-[#282828] px-2.5 py-1 rounded-lg">
                  {translations[language].currency}
                </span>
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickPills.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setBalanceVal(pill.toString())}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#1c1c1c] border border-[#e3e2de] dark:border-[#2f2f2f] hover:border-emerald-600 hover:text-emerald-600 text-[#5f5e5b] dark:text-[#9b9a97] transition-all tabular-nums cursor-pointer"
                  >
                    +{pill.toLocaleString('fr-FR')} {translations[language].currency}
                  </button>
                ))}
              </div>

              {/* Security Lock Note */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl flex items-start gap-2 text-right">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                  {t.warning}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isSubmitting
                    ? (isAr ? 'جاري حفظ البيانات...' : 'Enregistrement...')
                    : (isAr ? 'تأكيد وبدء استخدام فلوس' : 'Confirmer et ouvrir Flouss')}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t.confirmModalTitle}
        maxWidth="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-11 h-11 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div>
            <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
              {t.confirmModalDesc}
            </p>
            <div className="text-2xl font-bold text-[#37352f] dark:text-[#ecebed] mt-1 tabular-nums">
              {formatMAD(numericAmount, false, language)}
            </div>
          </div>

          <p className="text-xs text-[#5f5e5b] dark:text-[#9b9a97] bg-[#fbfbfa] dark:bg-[#1a1a1a] p-3 rounded-xl border border-[#e3e2de] dark:border-[#2f2f2f] leading-relaxed">
            {t.confirmWarning}
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowConfirmModal(false)}
            >
              {t.cancelButton}
            </Button>
            <Button
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              onClick={executeLockBalance}
              icon={<Lock className="w-4 h-4" />}
            >
              {isSubmitting
                ? (isAr ? 'جاري التأكيد...' : 'Enregistrement...')
                : t.confirmButton}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OnboardingModal;
