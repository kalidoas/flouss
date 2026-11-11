import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import {
  ShieldCheck,
  Lock,
  LogOut,
  AlertTriangle,
  Fingerprint,
  ScanFace,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { hashPin, getPinLockoutStatus, recordFailedPinAttempt, resetPinLockout } from '../../utils/crypto';
import {
  generateCryptographicOtp,
  storePendingOtpSession,
  verifyPendingOtpSession,
  clearPendingOtpSession,
  sendVerificationCodeEmail,
} from '../../services/emailAuthService';
import {
  isBiometricsEnrolled,
  authenticateWithPlatformBiometrics,
} from '../../utils/biometrics';

export { hashPin };

interface PinAuthScreenProps {
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    uid: string;
  };
  language?: 'ar' | 'fr' | 'en';
  onVerify: (pin: string) => boolean | Promise<boolean>;
  onLogout: () => void;
  /** If true, skip PIN unlock and show PIN creation flow instead */
  isNewPinSetup?: boolean;
  onPinCreated?: (pin: string) => void;
}

type PinScreenMode = 'verify' | 'create' | 'confirmCreate' | 'forgotPin_otp' | 'forgotPin_newPin' | 'forgotPin_confirmPin';

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({
  user,
  language = 'ar',
  onVerify,
  onLogout,
  isNewPinSetup = false,
  onPinCreated,
}) => {
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const [mode, setMode] = useState<PinScreenMode>(isNewPinSetup ? 'create' : 'verify');
  const [digits, setDigits] = useState<string[]>([]);
  const [firstPin, setFirstPin] = useState(''); // stores first entry in create/confirm flow
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lockout, setLockout] = useState(() => getPinLockoutStatus(user.uid));

  // Biometrics availability
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // Forgot PIN OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const otpInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    isBiometricsEnrolled(user.uid).then(setHasBiometrics);
  }, [user.uid]);

  useEffect(() => {
    if (!lockout.isLocked) return;
    const interval = setInterval(() => {
      const status = getPinLockoutStatus(user.uid);
      setLockout(status);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout.isLocked, user.uid]);

  // OTP timer countdown
  useEffect(() => {
    if (mode !== 'forgotPin_otp' || otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [mode, otpTimer]);

  // Physical keyboard listener for fast typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockout.isLocked) return;
      if (mode === 'forgotPin_otp') return; // OTP inputs handle their own keys
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, lockout.isLocked, mode]);

  const handleDigit = async (digit: string) => {
    if (lockout.isLocked || digits.length >= 4) return;
    const nextDigits = [...digits, digit];
    setDigits(nextDigits);
    setError(false);
    setErrorMessage('');

    if (nextDigits.length === 4) {
      const pin = nextDigits.join('');

      if (mode === 'verify') {
        const isValid = await onVerify(pin);
        if (isValid) {
          resetPinLockout(user.uid);
        } else {
          const updatedLockout = recordFailedPinAttempt(user.uid);
          setLockout(updatedLockout);
          setError(true);

          if (updatedLockout.isLocked) {
            setErrorMessage(
              isAr
                ? `تم قفل الحساب مؤقتاً لحمايتك بعد 5 محاولات خاطئة. يرجى الانتظار ${updatedLockout.remainingSeconds} ثانية.`
                : isFr
                ? `Compte temporairement verrouillé après 5 tentatives échouées. Veuillez patienter ${updatedLockout.remainingSeconds}s.`
                : `Account temporarily locked after 5 failed attempts. Please wait ${updatedLockout.remainingSeconds}s.`
            );
          } else {
            const remainingAttempts = 5 - updatedLockout.attemptsCount;
            setErrorMessage(
              isAr
                ? `رمز PIN غير صحيح. المحاولات المتبقية: ${remainingAttempts}`
                : isFr
                ? `Code PIN incorrect. Tentatives restantes : ${remainingAttempts}`
                : `Incorrect PIN. Remaining attempts: ${remainingAttempts}`
            );
          }

          setTimeout(() => {
            setDigits([]);
            setError(false);
          }, 600);
        }

      } else if (mode === 'create') {
        // Store first PIN entry, ask user to confirm
        setFirstPin(pin);
        setMode('confirmCreate');
        setDigits([]);
        setSuccessMessage('');

      } else if (mode === 'confirmCreate') {
        if (pin === firstPin) {
          // PINs match — save
          onPinCreated?.(pin);
        } else {
          setError(true);
          setErrorMessage(
            isAr
              ? 'رمزا PIN غير متطابقَين. يرجى المحاولة مرة أخرى.'
              : isFr
              ? 'Les codes PIN ne correspondent pas. Veuillez réessayer.'
              : 'PINs do not match. Please try again.'
          );
          setTimeout(() => {
            setDigits([]);
            setFirstPin('');
            setMode('create');
            setError(false);
            setErrorMessage('');
          }, 800);
        }

      } else if (mode === 'forgotPin_newPin') {
        setFirstPin(pin);
        setMode('forgotPin_confirmPin');
        setDigits([]);

      } else if (mode === 'forgotPin_confirmPin') {
        if (pin === firstPin) {
          onPinCreated?.(pin);
        } else {
          setError(true);
          setErrorMessage(
            isAr
              ? 'رمزا PIN غير متطابقَين. يرجى المحاولة مرة أخرى.'
              : isFr
              ? 'Les codes PIN ne correspondent pas. Veuillez réessayer.'
              : 'PINs do not match. Please try again.'
          );
          setTimeout(() => {
            setDigits([]);
            setFirstPin('');
            setMode('forgotPin_newPin');
            setError(false);
            setErrorMessage('');
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    setDigits([]);
    setError(false);
    setErrorMessage('');
  };

  // Handle platform biometric (Face ID / Touch ID) via registered WebAuthn credential
  const handleBiometric = async () => {
    try {
      const verified = await authenticateWithPlatformBiometrics(user.uid);
      if (verified) {
        await onVerify('__biometric__');
      }
    } catch {
      // User cancelled: silent fallback to PIN keypad
    }
  };

  // Initiate Forgot PIN flow: send OTP exclusively to email
  const handleForgotPin = async () => {
    if (!user.email) {
      setErrorMessage(
        isAr
          ? 'لم يتم العثور على بريد إلكتروني مرتبط بحسابك.'
          : isFr
          ? 'Aucun email associé à votre compte.'
          : 'No email found for your account.'
      );
      return;
    }
    setIsSendingOtp(true);
    setErrorMessage('');
    try {
      const code = generateCryptographicOtp();
      await storePendingOtpSession(user.email, code, {
        fullName: user.displayName || user.email.split('@')[0],
        mode: 'login',
      });
      const result = await sendVerificationCodeEmail(
        user.email,
        user.displayName || user.email.split('@')[0],
        code
      );
      if (!result.success) {
        setErrorMessage(
          result.error ||
            (isAr
              ? 'فشل إرسال رمز التحقق بالبريد. يرجى المحاولة مرة أخرى.'
              : isFr
              ? 'Échec de l’envoi du code par email. Veuillez réessayer.'
              : 'Failed to send verification code. Please retry.')
        );
        return;
      }
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60);
      setMode('forgotPin_otp');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch {
      setErrorMessage(
        isAr
          ? 'فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى.'
          : isFr
          ? 'Échec de l’envoi du code. Veuillez réessayer.'
          : 'Failed to send verification code. Please try again.'
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify the forgot-PIN OTP
  const handleVerifyForgotOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage(
        isAr ? 'يرجى إدخال الرمز المكون من 6 أرقام كاملاً.' : 'Veuillez saisir le code complet à 6 chiffres.'
      );
      return;
    }
    setIsSubmittingOtp(true);
    setErrorMessage('');
    try {
      const check = await verifyPendingOtpSession(code, user.email || '');
      if (!check.valid) {
        if (check.reason === 'expired') {
          setErrorMessage(
            isAr ? 'انتهت صلاحية الرمز (10 دقائق). اطلب رمزاً جديداً.' : 'Code expiré (10 min). Demandez un nouveau code.'
          );
        } else if (check.reason === 'max_attempts_exceeded') {
          setErrorMessage(
            isAr ? 'تم تجاوز الحد الأقصى للمحاولات (5 محاولات). اطلب رمزاً جديداً.' : 'Nombre maximal de tentatives dépassé (5 max). Demandez un nouveau code.'
          );
        } else {
          setErrorMessage(
            isAr
              ? `رمز غير صحيح. المحاولات المتبقية: ${check.attemptsRemaining ?? 0}`
              : `Code incorrect. Tentatives restantes : ${check.attemptsRemaining ?? 0}`
          );
        }
        return;
      }
      clearPendingOtpSession();
      setDigits([]);
      setFirstPin('');
      setMode('forgotPin_newPin');
    } catch {
      setErrorMessage(isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Une erreur est survenue. Réessayez.');
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    if (numeric.length > 1) {
      const pasted = numeric.slice(0, 6).split('');
      pasted.forEach((ch, idx) => { newDigits[idx] = ch; });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(5, pasted.length);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }
    newDigits[index] = numeric;
    setOtpDigits(newDigits);
    if (numeric && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // ── UI Labels by mode ──
  const getTitle = () => {
    switch (mode) {
      case 'verify': return isAr ? 'التحقق بخطوتين (رمز PIN)' : isFr ? 'Vérification en deux étapes (PIN)' : 'Two-Step Verification (PIN)';
      case 'create': return isAr ? 'إنشاء رمز PIN جديد' : isFr ? 'Créer votre code PIN' : 'Create Your PIN';
      case 'confirmCreate': return isAr ? 'تأكيد رمز PIN' : isFr ? 'Confirmer le code PIN' : 'Confirm Your PIN';
      case 'forgotPin_otp': return isAr ? 'رمز التحقق (البريد الإلكتروني)' : isFr ? 'Code de vérification (email)' : 'Verification Code (email)';
      case 'forgotPin_newPin': return isAr ? 'تعيين رمز PIN جديد' : isFr ? 'Définir un nouveau code PIN' : 'Set New PIN';
      case 'forgotPin_confirmPin': return isAr ? 'تأكيد رمز PIN الجديد' : isFr ? 'Confirmer le nouveau code PIN' : 'Confirm New PIN';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'verify': return isAr ? 'أدخل رمز PIN السري المكون من 4 أرقام لمتابعة الدخول' : isFr ? 'Saisissez votre code PIN secret à 4 chiffres pour continuer' : 'Enter your 4-digit secret PIN to continue';
      case 'create': return isAr ? 'اختر رمز PIN سرياً مكوناً من 4 أرقام لتأمين حسابك' : isFr ? 'Choisissez un code PIN secret à 4 chiffres pour sécuriser votre compte' : 'Choose a 4-digit secret PIN to secure your account';
      case 'confirmCreate': return isAr ? 'أعد إدخال رمز PIN للتأكيد' : isFr ? 'Saisissez à nouveau votre PIN pour confirmer' : 'Re-enter your PIN to confirm';
      case 'forgotPin_newPin': return isAr ? 'أدخل رمز PIN الجديد المكون من 4 أرقام' : isFr ? 'Entrez votre nouveau code PIN à 4 chiffres' : 'Enter your new 4-digit PIN';
      case 'forgotPin_confirmPin': return isAr ? 'أعد إدخال رمز PIN الجديد' : isFr ? 'Confirmez votre nouveau PIN' : 'Confirm your new PIN';
      default: return '';
    }
  };

  // ── OTP Screen ──
  if (mode === 'forgotPin_otp') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#191919] p-4 transition-colors">
        <div className="w-full max-w-sm bg-white dark:bg-[#202020] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#e3e2de] dark:border-[#2f2f2f] text-center animate-in zoom-in-95 duration-200">
          <div className="flex justify-center mb-3">
            <Logo size="md" showWordmark={true} />
          </div>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-base font-bold text-[#37352f] dark:text-[#ecebed] mb-1">
            {isAr ? 'رمز التحقق' : isFr ? 'Code de vérification' : 'Verification Code'}
          </h2>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97] mb-1">
            {isAr ? 'أرسلنا رمزاً إلى:' : isFr ? 'Nous avons envoyé un code à :' : 'We sent a code to:'}
          </p>
          <p className="text-xs font-mono font-semibold text-indigo-500 dark:text-indigo-400 mb-4">
            {user.email}
          </p>

          {errorMessage && (
            <p className="text-xs text-rose-500 font-medium mb-3 animate-shake">{errorMessage}</p>
          )}

          <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
            <div dir="ltr" className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 rounded-xl border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-center text-lg font-bold font-mono text-[#37352f] dark:text-[#ecebed] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmittingOtp || otpDigits.join('').length !== 6}
              className="w-full py-2.5 px-4 rounded-full bg-[#37352f] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer active:scale-[0.98]"
            >
              {isSubmittingOtp
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <><span>{isAr ? 'تحقق والمتابعة' : isFr ? 'Vérifier et continuer' : 'Verify & Continue'}</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="flex items-center justify-between mt-4 text-xs">
            <button
              type="button"
              onClick={() => { setMode('verify'); setErrorMessage(''); }}
              className="text-[#787774] hover:text-[#37352f] dark:hover:text-[#ecebed] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isAr ? 'رجوع' : isFr ? 'Retour' : 'Back'}
            </button>
            <button
              type="button"
              disabled={otpTimer > 0 || isSendingOtp}
              onClick={handleForgotPin}
              className={`font-medium transition-colors cursor-pointer ${otpTimer > 0 ? 'text-[#b0aeaa] dark:text-[#4a4a4a] cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-400'}`}
            >
              {otpTimer > 0
                ? (isAr ? `إعادة الإرسال (${otpTimer}ث)` : isFr ? `Renvoyer (${otpTimer}s)` : `Resend (${otpTimer}s)`)
                : (isAr ? 'إعادة الإرسال' : isFr ? 'Renvoyer' : 'Resend')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main PIN pad screen (verify / create / confirmCreate / forgotPin_newPin / forgotPin_confirmPin) ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#191919] p-4 transition-colors">
      <div className="w-full max-w-sm bg-white dark:bg-[#202020] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#e3e2de] dark:border-[#2f2f2f] text-center animate-in zoom-in-95 duration-200">
        {/* Top Logo */}
        <div className="flex justify-center mb-3">
          <Logo size="md" showWordmark={true} />
        </div>

        {/* User Identity Pill */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] mb-4 max-w-full">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-6 h-6 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-right truncate">
            <span className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed] block truncate">
              {user.displayName || user.email?.split('@')[0]}
            </span>
          </div>
        </div>

        {/* Security Title & Description */}
        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#37352f] dark:text-[#ecebed]">
            {getTitle()}
          </h2>
          {getSubtitle() && (
            <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
              {getSubtitle()}
            </p>
          )}
          {/* New PIN setup: show welcome message */}
          {mode === 'create' && isNewPinSetup && (
            <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
              {isAr
                ? '🎉 مرحباً بك في مساحة عملك! قم بإنشاء رمز PIN لتأمين حسابك.'
                : isFr
                ? '🎉 Bienvenue dans votre espace de travail ! Créez un PIN pour sécuriser votre compte.'
                : '🎉 Welcome to your workspace! Create a PIN to secure your account.'}
            </div>
          )}
        </div>

        {/* 4 PIN Dots */}
        <div className="flex justify-center gap-3.5 py-2 mb-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = digits.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 border-rose-500 scale-110'
                    : isFilled
                    ? (mode === 'verify' ? 'bg-emerald-600 border-emerald-600 scale-110' : 'bg-indigo-500 border-indigo-500 scale-110')
                    : 'border-[#e3e2de] dark:border-[#3f3f3f] bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Lockout banner or Error message */}
        {lockout.isLocked ? (
          <div className="p-3 my-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? `تم قفل الحساب مؤقتاً (${lockout.remainingSeconds} ثانية متبقية)`
                : isFr
                ? `Compte verrouillé (${lockout.remainingSeconds}s restantes)`
                : `Account locked (${lockout.remainingSeconds}s remaining)`}
            </span>
          </div>
        ) : errorMessage ? (
          <p className="text-xs text-rose-500 font-medium mb-2 animate-shake">{errorMessage}</p>
        ) : null}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={lockout.isLocked}
              onClick={() => handleDigit(num)}
              className={`h-11 rounded-xl bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-all shadow-2xs ${
                lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Clear | 0 | Biometric (verify) or Delete (create) */}
          <button
            type="button"
            disabled={lockout.isLocked}
            onClick={handleClear}
            className={`h-11 rounded-xl text-xs font-medium text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 flex items-center justify-center transition-all ${
              lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isAr ? 'مسح' : 'C'}
          </button>

          <button
            type="button"
            disabled={lockout.isLocked}
            onClick={() => handleDigit('0')}
            className={`h-11 rounded-xl bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-all shadow-2xs ${
              lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            0
          </button>

          {/* Biometric icon on verify mode ONLY if enrolled on this device | Otherwise Delete button */}
          {mode === 'verify' && hasBiometrics ? (
            <button
              type="button"
              onClick={handleBiometric}
              title={isAr ? 'Face ID / Touch ID' : 'Face ID / Touch ID'}
              className="h-11 rounded-xl text-indigo-500 hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Biometric authentication"
            >
              <ScanFace className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={lockout.isLocked}
              onClick={handleDelete}
              className={`h-11 rounded-xl text-xs font-medium text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 flex items-center justify-center transition-all ${
                lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
              aria-label="Supprimer"
            >
              ⌫
            </button>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-5 mt-4 border-t border-[#e3e2de] dark:border-[#2f2f2f] space-y-2">
          {/* Forgot PIN (verify mode only) */}
          {mode === 'verify' && user.email && (
            <button
              type="button"
              disabled={isSendingOtp}
              onClick={handleForgotPin}
              className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-colors"
            >
              {isSendingOtp
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>{isAr ? 'جاري الإرسال...' : isFr ? 'Envoi...' : 'Sending...'}</span></>
                : <span>{isAr ? 'نسيت رمز PIN؟' : isFr ? 'Code PIN oublié ?' : 'Forgot PIN?'}</span>
              }
            </button>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الخروج والرجوع' : isFr ? 'Changer de compte Google' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinAuthScreen;
