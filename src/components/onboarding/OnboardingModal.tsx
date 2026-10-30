import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { formatMAD } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Logo } from '../common/Logo';
import {
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Coins,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

type OnboardingStep = 'email' | 'verify' | 'pin' | 'balance';

export const OnboardingModal: React.FC = () => {
  const { isOnboarded, lockInitialBalance, language, accounts, activeAccountId } = useAppStore();
  const t = translations[language].onboarding;
  const tCommon = translations[language].common;
  const isAr = language === 'ar';

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const [step, setStep] = useState<OnboardingStep>('email');

  // Step 1: Email & Name
  const [email, setEmail] = useState('');
  const [accountName, setAccountName] = useState('Khalid');

  // Step 2: Verification Code
  const [generatedCode, setGeneratedCode] = useState('749201');
  const [enteredCode, setEnteredCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  // Step 3: PIN (4 digits)
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');

  // Step 4: Starting Balance
  const [balanceVal, setBalanceVal] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [error, setError] = useState<string>('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (isOnboarded) return null;

  // --- Step 1 Submit (Email -> Send Code) ---
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError(
        isAr
          ? 'يرجى إدخال بريد إلكتروني صحيح'
          : 'Veuillez renseigner une adresse email valide'
      );
      return;
    }
    setError('');
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setResendTimer(30);
    setStep('verify');
  };

  // --- Step 2 Submit (Verify Code) ---
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode.trim() !== generatedCode) {
      setError(
        isAr
          ? 'الرمز غير صحيح، يرجى إعادة المحاولة'
          : 'Le code de vérification est incorrect'
      );
      return;
    }
    setError('');
    setStep('pin');
  };

  // --- Step 3 Handle PIN Pad Input ---
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

  // --- Step 4 Submit (Balance) ---
  const numericAmount = parseFloat(balanceVal.replace(/\s/g, '').replace(',', '.')) || 0;

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
    setError('');
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    lockInitialBalance(numericAmount, {
      email: email.trim(),
      pinCode: pin,
      accountName: accountName.trim() || 'Principal',
    });
    setShowConfirmModal(false);
  };

  const quickPills = [2000, 5000, 10000, 20000, 35000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-lg p-5 sm:p-7 shadow-xl border border-[#e3e2de] dark:border-[#2f2f2f] text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Brand Logo & Step Indicator */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e3e2de] dark:border-[#2f2f2f]">
          <Logo size="md" showWordmark={true} />
          <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97]">
            <span className="font-medium text-[#37352f] dark:text-[#ecebed]">
              {step === 'email' ? '1' : step === 'verify' ? '2' : step === 'pin' ? '3' : '4'}
            </span>
            <span>/</span>
            <span>4</span>
          </div>
        </div>

        {/* ================= STEP 1: Email & Name ================= */}
        {step === 'email' && (
          <div className="space-y-4 text-left">
            <div>
              <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ecebed]">
                {isAr ? 'إنشاء حسابك وتأمينه' : 'Créer votre compte'}
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
                {isAr
                  ? 'أدخل بريدك الإلكتروني لربط حسابك وتأمين بياناتك'
                  : 'Renseignez votre email pour sécuriser vos données et séparer vos comptes.'}
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#37352f] dark:text-[#ecebed] mb-1">
                  {isAr ? 'اسم الحساب / الملف الشخصي' : 'Nom du profil'}
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ex: Khalid ou Personnel"
                  className="w-full text-xs py-2 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:outline-none focus:border-[#2383e2]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#37352f] dark:text-[#ecebed] mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Adresse Email'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#787774] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="votre-email@gmail.com"
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:outline-none focus:border-[#2383e2]"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              <div className="pt-2">
                <Button type="submit" variant="primary" fullWidth icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  {isAr ? 'إرسال رمز التأكيد' : 'Continuer et recevoir le code'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: Email Verification Code ================= */}
        {step === 'verify' && (
          <div className="space-y-4 text-left">
            <div>
              <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ecebed]">
                {isAr ? 'تأكيد البريد الإلكتروني' : 'Vérification du code'}
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
                {isAr
                  ? `أرسلنا رمز تحقق مكون من 6 أرقام إلى ${email}`
                  : `Nous avons envoyé un code de vérification à 6 chiffres à ${email}.`}
              </p>
            </div>

            {/* Simulated verification helper pill */}
            <div className="p-2.5 rounded-md bg-[#f1f0ee] dark:bg-[#282828] border border-[#e3e2de] dark:border-[#2f2f2f] text-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#787774] dark:text-[#9b9a97] block">
                  {isAr ? 'رمز التحقق التجريبي :' : 'Code de test (cliquez pour remplir) :'}
                </span>
                <span className="font-mono font-bold text-sm text-[#2383e2]">{generatedCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setEnteredCode(generatedCode)}
                className="px-2 py-1 rounded bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] text-[11px] font-medium text-[#37352f] dark:text-[#ecebed] hover:bg-[#e6e5e2]"
              >
                {isAr ? 'ملء تلقائي' : 'Remplir'}
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#37352f] dark:text-[#ecebed] mb-1">
                  {isAr ? 'أدخل رمز التحقق' : 'Entrez le code à 6 chiffres'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="______"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-2 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:outline-none focus:border-[#2383e2]"
                />
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              <div className="flex items-center justify-between text-xs text-[#787774] pt-1">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="hover:text-[#37352f] dark:hover:text-[#ecebed]"
                >
                  ← {isAr ? 'تعديل الإيميل' : 'Modifier email'}
                </button>
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={() => {
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedCode(code);
                    setResendTimer(30);
                  }}
                  className={`hover:underline ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : 'text-[#2383e2]'}`}
                >
                  {resendTimer > 0 ? `${isAr ? 'إعادة الإرسال بعد' : 'Renvoyer dans'} ${resendTimer}s` : (isAr ? 'إعادة الإرسال' : 'Renvoyer code')}
                </button>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" fullWidth icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  {isAr ? 'تأكيد والمتابعة' : 'Valider et continuer'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: Security PIN Setup ================= */}
        {step === 'pin' && (
          <div className="space-y-4">
            <div>
              <div className="w-9 h-9 mx-auto rounded-md bg-[#f1f0ee] dark:bg-[#282828] text-[#2383e2] flex items-center justify-center mb-2">
                <KeyRound className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ecebed]">
                {pinStep === 'create'
                  ? isAr
                    ? 'حدد رمز PIN السري (4 أرقام)'
                    : 'Définissez votre code PIN (4 chiffres)'
                  : isAr
                  ? 'أكد رمز PIN'
                  : 'Confirmez votre code PIN'}
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
                {isAr
                  ? 'هذا الرمز سيحمي تطبيقك ويفصل بين حساباتك'
                  : 'Ce code protégera votre interface lors du changement de profil.'}
              </p>
            </div>

            {/* 4 Dots indicator */}
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinStep === 'create' ? idx < pin.length : idx < pinConfirm.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                      isFilled
                        ? 'bg-[#2383e2] border-[#2383e2] scale-110'
                        : 'border-[#e3e2de] dark:border-[#3f3f3f] bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            {/* Notion Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="h-10 rounded-md bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-colors"
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
                  } else {
                    setStep('verify');
                  }
                }}
                className="h-10 rounded-md text-xs text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="h-10 rounded-md bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinDelete}
                className="h-10 rounded-md text-xs text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] flex items-center justify-center transition-colors"
              >
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: Initial Balance Setup ================= */}
        {step === 'balance' && (
          <div className="space-y-4 text-left">
            <div>
              <div className="w-9 h-9 mx-auto rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-2">
                <Coins className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ecebed] text-center">
                {t.question}
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5 text-center">
                {t.hint}
              </p>
            </div>

            <form onSubmit={handleBalanceSubmit} className="space-y-3">
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
                  className="w-full text-2xl font-semibold py-2.5 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:border-[#2383e2] outline-none transition-all pr-16 tabular-nums"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-[#787774] bg-[#f1f0ee] dark:bg-[#282828] px-2 py-1 rounded">
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
                    className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] hover:border-[#2383e2] text-[#5f5e5b] dark:text-[#9b9a97] transition-colors tabular-nums"
                  >
                    +{pill.toLocaleString('fr-FR')} {translations[language].currency}
                  </button>
                ))}
              </div>

              {/* Warning Box */}
              <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-md flex items-start gap-2 text-left">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-normal">
                  {t.warning}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  {isAr ? 'تأكيد وبدء الجولة التوضيحية' : 'Confirmer et découvrir l’application'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Final Lock Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t.confirmModalTitle}
        maxWidth="sm"
      >
        <div className="text-center space-y-3.5">
          <div className="w-10 h-10 mx-auto rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div>
            <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
              {t.confirmModalDesc}
            </p>
            <div className="text-2xl font-semibold text-[#37352f] dark:text-[#ecebed] mt-1 tabular-nums">
              {formatMAD(numericAmount, false, language)}
            </div>
          </div>

          <p className="text-xs text-[#5f5e5b] dark:text-[#9b9a97] bg-[#fbfbfa] dark:bg-[#1a1a1a] p-2.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] leading-normal">
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
              onClick={handleFinalConfirm}
              icon={<Lock className="w-3.5 h-3.5" />}
            >
              {t.confirmButton}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
