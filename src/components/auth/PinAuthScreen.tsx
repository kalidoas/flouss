import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import {
  ShieldCheck,
  Lock,
  LogOut,
  AlertTriangle,
  ScanFace,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import {
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { getPinLockoutStatus, recordFailedPinAttempt, resetPinLockout } from '../../utils/crypto';
import {
  isBiometricsEnrolled,
  authenticateWithPlatformBiometrics,
} from '../../utils/biometrics';

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
  onPinCreated?: (pin: string) => void | Promise<void>;
}

type PinScreenMode =
  | 'verify'
  | 'create'
  | 'confirmCreate'
  | 'reauth_password'
  | 'forgotPin_newPin'
  | 'forgotPin_confirmPin';

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
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockout, setLockout] = useState(() => getPinLockoutStatus(user.uid));

  // Biometrics availability
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // Re-auth password state (for email/password users recovering PIN)
  const [reauthPassword, setReauthPassword] = useState('');
  const [showReauthPassword, setShowReauthPassword] = useState(false);
  const [reauthenticating, setReauthenticating] = useState(false);

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

  // Physical keyboard listener for fast typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockout.isLocked || isSubmitting) return;
      if (mode === 'reauth_password') return;
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
  }, [digits, isSubmitting, lockout.isLocked, mode]);

  const handleDigit = async (digit: string) => {
    if (lockout.isLocked || isSubmitting || digits.length >= 4) return;
    const nextDigits = [...digits, digit];
    setDigits(nextDigits);
    setError(false);
    setErrorMessage('');

    if (nextDigits.length === 4) {
      const pin = nextDigits.join('');

      if (mode === 'verify') {
        setIsSubmitting(true);
        let isValid = false;
        let verificationFailed = false;
        try {
          isValid = await onVerify(pin);
        } catch (err) {
          verificationFailed = true;
          console.error('[Flouss Security] PIN verification failed:', err);
          setDigits([]);
          setError(true);
          setErrorMessage(
            isAr
              ? 'تعذر التحقق من PIN. تحقق من الاتصال وحاول مجدداً.'
              : isFr
              ? 'Impossible de vérifier le PIN. Vérifiez votre connexion et réessayez.'
              : 'Could not verify PIN. Check your connection and try again.'
          );
        } finally {
          setIsSubmitting(false);
        }
        if (verificationFailed) return;
        if (isValid) {
          resetPinLockout(user.uid);
          setDigits([]);
        } else {
          setError(true);
          const updatedLockout = recordFailedPinAttempt(user.uid);
          setLockout(updatedLockout);

          if (updatedLockout.isLocked) {
            setErrorMessage(
              isAr
                ? `تم قفل الدخول مؤقتاً (${updatedLockout.remainingSeconds} ثانية)`
                : isFr
                ? `Compte verrouillé temporairement (${updatedLockout.remainingSeconds}s)`
                : `Account temporarily locked (${updatedLockout.remainingSeconds}s)`
            );
          } else {
            const attemptsLeft = Math.max(0, 5 - updatedLockout.attemptsCount);
            setErrorMessage(
              isAr
                ? `رمز PIN غير صحيح (${attemptsLeft} محاولات متبقية)`
                : isFr
                ? `Code PIN incorrect (${attemptsLeft} essais restants)`
                : `Incorrect PIN (${attemptsLeft} attempts remaining)`
            );
          }
          setTimeout(() => {
            setDigits([]);
            setError(false);
          }, 600);
        }
      } else if (mode === 'create') {
        setFirstPin(pin);
        setDigits([]);
        setMode('confirmCreate');
      } else if (mode === 'confirmCreate') {
        if (pin === firstPin) {
          if (onPinCreated) {
            await onPinCreated(pin);
          }
          await onVerify(pin);
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
        setDigits([]);
        setMode('forgotPin_confirmPin');
      } else if (mode === 'forgotPin_confirmPin') {
        if (pin === firstPin) {
          if (onPinCreated) {
            await onPinCreated(pin);
          }
          resetPinLockout(user.uid);
          await onVerify(pin);
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

  // Platform biometric (Face ID / Touch ID)
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

  // Forgot PIN: Re-authenticate with Google or Password
  const handleForgotPin = async () => {
    setErrorMessage('');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      onLogout();
      return;
    }

    const isGoogle = currentUser.providerData.some((p: any) => p.providerId === 'google.com');

    if (isGoogle) {
      setReauthenticating(true);
      try {
        await reauthenticateWithPopup(currentUser, googleProvider);
        // Successfully re-authenticated! Allow setting new PIN
        setDigits([]);
        setFirstPin('');
        setMode('forgotPin_newPin');
      } catch (err: any) {
        const code = err?.code || '';
        if (code !== 'auth/popup-closed-by-user') {
          setErrorMessage(
            isAr
              ? 'فشل التحقق من حساب Google. يرجى المحاولة مجدداً.'
              : isFr
              ? 'Échec de la ré-authentification Google.'
              : 'Google re-authentication failed.'
          );
        }
      } finally {
        setReauthenticating(false);
      }
    } else {
      // Email/password user: prompt for password
      setReauthPassword('');
      setMode('reauth_password');
    }
  };

  const handleReauthWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reauthPassword) return;

    setReauthenticating(true);
    setErrorMessage('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        onLogout();
        return;
      }
      const cred = EmailAuthProvider.credential(currentUser.email, reauthPassword);
      await reauthenticateWithCredential(currentUser, cred);

      // Successfully re-authenticated! Allow setting new PIN
      setReauthPassword('');
      setDigits([]);
      setFirstPin('');
      setMode('forgotPin_newPin');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage(
          isAr
            ? 'كلمة المرور غير صحيحة.'
            : isFr
            ? 'Mot de passe incorrect.'
            : 'Incorrect password.'
        );
      } else {
        setErrorMessage(
          isAr
            ? 'فشل التحقق من الهوية. يرجى المحاولة مجدداً.'
            : isFr
            ? 'Échec de l’authentification. Veuillez réessayer.'
            : 'Authentication failed. Please try again.'
        );
      }
    } finally {
      setReauthenticating(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
      case 'forgotPin_newPin':
        return isAr ? 'إنشاء رمز PIN جديد (4 أرقام)' : isFr ? 'Créer un code PIN à 4 chiffres' : 'Create a 4-digit PIN';
      case 'confirmCreate':
      case 'forgotPin_confirmPin':
        return isAr ? 'تأكيد رمز PIN' : isFr ? 'Confirmer le code PIN' : 'Confirm your PIN';
      case 'reauth_password':
        return isAr ? 'تأكيد كلمة المرور' : isFr ? 'Vérification du mot de passe' : 'Verify Password';
      case 'verify':
      default:
        return isAr ? 'رمز PIN السري' : isFr ? 'Déverrouiller avec le PIN' : 'Enter Secret PIN';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'create':
      case 'forgotPin_newPin':
        return isAr ? 'اختر 4 أرقام سهلة التذكر لحماية بياناتك' : isFr ? 'Choisissez 4 chiffres pour protéger vos données' : 'Choose 4 digits to protect your workspace';
      case 'confirmCreate':
      case 'forgotPin_confirmPin':
        return isAr ? 'أعد إدخال نفس الأرقام الأربعة للتأكيد' : isFr ? 'Retapez les 4 chiffres pour confirmer' : 'Re-enter the 4 digits to confirm';
      case 'reauth_password':
        return isAr ? 'أدخل كلمة مرور حسابك لتتمكن من إعادة تعيين PIN' : isFr ? 'Saisissez votre mot de passe pour réinitialiser le PIN' : 'Enter your password to reset your PIN';
      case 'verify':
      default:
        return isAr ? 'أدخل الرمز المكون من 4 أرقام للمتابعة' : isFr ? 'Saisissez votre code à 4 chiffres pour continuer' : 'Enter your 4-digit code to continue';
    }
  };

  // ── Password Re-authentication Screen (Forgot PIN) ──
  if (mode === 'reauth_password') {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-zinc-100 px-4 py-8 relative overflow-hidden select-none"
      >
        <div
          className="fixed inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1), transparent 50%)',
          }}
        />

        <div className="w-full max-w-sm flex flex-col items-center gap-5 p-6 sm:p-8 rounded-[28px] bg-[#0D0E14]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] relative z-10 text-center">
          <Logo size="md" showWordmark={true} />

          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Key className="w-6 h-6 stroke-[2]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">{getTitle()}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">{getSubtitle()}</p>
          </div>

          {errorMessage && (
            <div className="w-full flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-start">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="flex-1 leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleReauthWithPassword} className="w-full space-y-3 pt-1">
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showReauthPassword ? 'text' : 'password'}
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full text-xs pl-10 rtl:pl-10 rtl:pr-10 pr-10 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowReauthPassword(!showReauthPassword)}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
              >
                {showReauthPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={reauthenticating || !reauthPassword}
              className="w-full py-2.5 px-4 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
            >
              {reauthenticating ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isAr ? 'تأكيد' : isFr ? 'Confirmer' : 'Confirm'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode('verify');
              setErrorMessage('');
            }}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{isAr ? 'إلغاء' : isFr ? 'Annuler' : 'Cancel'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Main PIN Screen (Keypad) ──
  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-zinc-100 px-4 py-8 relative overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1), transparent 50%)',
        }}
      />

      <div className="w-full max-w-sm flex flex-col items-center gap-4 p-6 sm:p-8 rounded-[28px] bg-[#0D0E14]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] relative z-10 text-center">

        {/* Logo */}
        <Logo size="md" showWordmark={true} />

        {/* User Pill */}
        <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/[0.04] border border-white/[0.08] max-w-full">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-5 h-5 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-zinc-300 truncate">
            {user.displayName || user.email?.split('@')[0]}
          </span>
        </div>

        {/* Header Icon & Title */}
        <div className="space-y-1">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1">
            <Lock className="w-5 h-5 stroke-[2]" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{getTitle()}</h2>
          <p className="text-xs text-zinc-400">{getSubtitle()}</p>
        </div>

        {/* PIN entry progress */}
        <div className="flex justify-center items-center gap-3.5 py-2 min-h-8" aria-live="polite">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2 text-xs text-indigo-300">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {isAr ? 'جارٍ التحقق...' : isFr ? 'Vérification...' : 'Checking PIN...'}
            </span>
          ) : (
          [0, 1, 2, 3].map((idx) => {
            const isFilled = digits.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 border-rose-500 scale-110'
                    : isFilled
                    ? 'bg-white border-white scale-110'
                    : 'border-white/[0.15] bg-transparent'
                }`}
              />
            );
          })
          )}
        </div>

        {/* Error / Lockout Messages */}
        {lockout.isLocked ? (
          <div className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              {isAr
                ? `تم قفل الحساب مؤقتاً (${lockout.remainingSeconds} ثانية متبقية)`
                : isFr
                ? `Compte verrouillé (${lockout.remainingSeconds}s restantes)`
                : `Account locked (${lockout.remainingSeconds}s remaining)`}
            </span>
          </div>
        ) : errorMessage ? (
          <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
        ) : null}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[210px] mx-auto pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={lockout.isLocked || isSubmitting}
              onClick={() => handleDigit(num)}
              className={`h-11 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/[0.06] text-sm font-semibold text-white transition-all shadow-xs ${
                lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            disabled={lockout.isLocked || isSubmitting}
            onClick={handleClear}
            className={`h-11 rounded-2xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] active:scale-95 flex items-center justify-center transition-all ${
              lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isAr ? 'مسح' : 'C'}
          </button>

          {/* Zero */}
          <button
            type="button"
            disabled={lockout.isLocked || isSubmitting}
            onClick={() => handleDigit('0')}
            className={`h-11 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/[0.06] text-sm font-semibold text-white transition-all shadow-xs ${
              lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            0
          </button>

          {/* Biometric Button or Delete */}
          {mode === 'verify' && hasBiometrics ? (
            <button
              type="button"
              onClick={handleBiometric}
              className="h-11 rounded-2xl text-indigo-400 hover:text-white hover:bg-indigo-500/10 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Biometric authentication"
            >
              <ScanFace className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={lockout.isLocked || isSubmitting}
              onClick={handleDelete}
              className={`h-11 rounded-2xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] active:scale-95 flex items-center justify-center transition-all ${
                lockout.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
              aria-label="Delete"
            >
              ⌫
            </button>
          )}
        </div>

        {/* Footer Actions: Forgot PIN + Sign out */}
        <div className="w-full pt-3 mt-2 border-t border-white/[0.06] space-y-2">
          {mode === 'verify' && (
            <button
              type="button"
              disabled={reauthenticating}
              onClick={handleForgotPin}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-1 mx-auto cursor-pointer transition-colors"
            >
              {reauthenticating ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isAr ? 'نسيت رمز PIN؟' : isFr ? 'Code PIN oublié ?' : 'Forgot PIN?'}</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? 'استخدام حساب آخر'
                : language === 'fr'
                ? 'Utiliser un autre compte'
                : 'Use another account'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinAuthScreen;
