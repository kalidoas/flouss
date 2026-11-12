import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Logo } from '../common/Logo';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  LogOut,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export const EmailVerificationScreen: React.FC = () => {
  const { language, reloadFirebaseUser, logout, firebaseUser } = useAppStore();
  const tAuth = translations[language].auth;
  const isAr = language === 'ar';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [showLinkFallback, setShowLinkFallback] = useState(false);

  const email = firebaseUser?.email || auth.currentUser?.email || '';

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus the first empty digit box on mount
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex((d) => !d);
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    inputRefs.current[targetIndex]?.focus();
  }, []);

  // Send initial OTP code on mount if authenticated
  useEffect(() => {
    let sent = false;
    if (auth.currentUser && !sent) {
      sent = true;
      handleSendOtp(true);
    }
  }, []);

  const handleSendOtp = async (isInitial = false) => {
    if (!isInitial && cooldown > 0) return;
    setIsSending(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage(isAr ? 'لم يتم العثور على جلسة مستخدم نشطة.' : 'Utilisateur non connecté.');
        setIsSending(false);
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If API route is not available (e.g. running vite dev standalone), show link fallback
        if (res.status === 404 || res.status === 502) {
          setShowLinkFallback(true);
        }
        setErrorMessage(
          data?.error ||
            (isAr
              ? 'فشل إرسال رمز التحقق. يرجى المحاولة لاحقاً.'
              : 'Échec de l’envoi du code. Veuillez réessayer.')
        );
        if (data?.retryAfter) {
          setCooldown(data.retryAfter);
        }
      } else {
        setCooldown(data?.cooldownSeconds || 60);
        setStatusMessage(
          isAr
            ? 'تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني.'
            : language === 'fr'
            ? 'Un code de vérification à 6 chiffres a été envoyé à votre adresse email.'
            : 'A 6-digit verification code has been sent to your email.'
        );
      }
    } catch (err: any) {
      setShowLinkFallback(true);
      setErrorMessage(
        isAr
          ? 'تعذر الاتصال بخدمة التحقق. تأكد من اتصالك بالإنترنت.'
          : 'Impossible de joindre le service de vérification.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    setErrorMessage(null);
    const cleaned = val.replace(/\D/g, '');

    // Handle single digit input
    if (cleaned.length <= 1) {
      const newDigits = [...digits];
      newDigits[index] = cleaned;
      setDigits(newDigits);

      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // If full 6 digits are now filled, auto-submit
      const fullCode = newDigits.join('');
      if (fullCode.length === 6 && !newDigits.some((d) => !d)) {
        submitVerificationCode(fullCode);
      }
      return;
    }

    // Handle multi-character paste / fast typing
    handlePasteString(cleaned, index);
  };

  const handlePasteString = (pasted: string, startIndex = 0) => {
    const raw = pasted.replace(/\D/g, '').slice(0, 6);
    if (!raw) return;

    const newDigits = [...digits];
    for (let i = 0; i < raw.length && startIndex + i < 6; i++) {
      newDigits[startIndex + i] = raw[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(5, startIndex + raw.length);
    inputRefs.current[nextIndex]?.focus();

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      submitVerificationCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const submitVerificationCode = async (code: string) => {
    if (isVerifying) return;
    if (code.length !== 6) {
      setErrorMessage(
        isAr ? 'يرجى إدخال 6 أرقام كاملة.' : 'Veuillez saisir un code complet à 6 chiffres.'
      );
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage('Utilisateur non connecté.');
        setIsVerifying(false);
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (typeof data?.attemptsLeft === 'number') {
          setAttemptsRemaining(data.attemptsLeft);
        }
        setErrorMessage(
          data?.error ||
            (isAr
              ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.'
              : 'Code de vérification incorrect ou expiré.')
        );
        setIsVerifying(false);
      } else {
        // Success! Reload user and force token refresh to propagate emailVerified: true
        await user.reload();
        await user.getIdToken(true);
        await reloadFirebaseUser();
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (isAr
            ? 'حدث خطأ أثناء التحقق من الرمز.'
            : 'Erreur lors de la vérification du code.')
      );
      setIsVerifying(false);
    }
  };

  // Fallback link verification (useful if email serverless function is not reachable locally)
  const handleFallbackLinkVerification = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setStatusMessage(
          isAr
            ? 'تم إرسال رابط تأكيد تقليدي إلى بريدك الإلكتروني.'
            : 'Un lien de confirmation standard a été envoyé par email.'
        );
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Erreur lors de l’envoi');
    }
  };

  const handleManualCheckLink = async () => {
    setIsVerifying(true);
    try {
      const u = auth.currentUser;
      if (u) {
        await u.reload();
        await u.getIdToken(true);
      }
      await reloadFirebaseUser();
    } catch {}
    setIsVerifying(false);
  };

  const currentCode = digits.join('');

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
            'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1), transparent 50%)',
        }}
      />

      <div className="w-full max-w-md flex flex-col items-center gap-6 p-6 sm:p-8 rounded-[28px] bg-[#0D0E14]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] relative z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Logo */}
        <Logo size="md" showWordmark={true} />

        {/* Mail Icon with ambient ring */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Mail className="w-8 h-8 stroke-[1.75]" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-sm -z-10 animate-pulse" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {isAr
              ? 'تأكيد البريد الإلكتروني'
              : language === 'fr'
              ? 'Confirmez votre adresse email'
              : 'Verify your email'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {isAr
              ? 'أدخل رمز التحقق المكون من 6 أرقام المرسل إلى :'
              : language === 'fr'
              ? 'Saisissez le code à 6 chiffres envoyé à :'
              : 'Enter the 6-digit code sent to:'}
          </p>
          <div className="inline-block py-1 px-3.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-mono font-semibold text-indigo-300">
            {email}
          </div>
        </div>

        {/* 6-Digit OTP Box Input */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5" dir="ltr">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => {
                  e.preventDefault();
                  const paste = e.clipboardData.getData('text');
                  handlePasteString(paste, index);
                }}
                className={`w-11 h-14 sm:w-12 sm:h-15 text-center text-2xl font-bold font-mono rounded-xl border bg-white/[0.04] text-white outline-none transition-all duration-150 tabular-nums ${
                  digit
                    ? 'border-indigo-500/70 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'border-white/10 hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'
                }`}
              />
            ))}
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="w-full flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-start animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="flex-1 leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="w-full flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-start animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="flex-1 leading-relaxed">{statusMessage}</span>
            </div>
          )}

          {attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining < 5 && (
            <p className="text-[11px] text-amber-400 font-medium">
              {isAr
                ? `المحاولات المتبقية: ${attemptsRemaining}`
                : `${attemptsRemaining} tentative${attemptsRemaining > 1 ? 's' : ''} restante${attemptsRemaining > 1 ? 's' : ''}`}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="button"
            disabled={currentCode.length !== 6 || isVerifying}
            onClick={() => submitVerificationCode(currentCode)}
            className="w-full py-3.5 px-4 rounded-full bg-white text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isAr
                    ? 'تأكيد الرمز والمتابعة'
                    : language === 'fr'
                    ? 'Vérifier le code'
                    : 'Verify and Continue'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="w-full space-y-2 pt-1 border-t border-white/[0.06]">
          {/* Resend OTP button */}
          <button
            type="button"
            disabled={isSending || cooldown > 0}
            onClick={() => handleSendOtp(false)}
            className="w-full py-2 px-4 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
            <span>
              {cooldown > 0
                ? isAr
                  ? `إعادة إرسال الرمز بعد (${cooldown} ثانية)`
                  : language === 'fr'
                  ? `Renvoyer le code dans ${cooldown}s`
                  : `Resend code in ${cooldown}s`
                : isAr
                ? 'إعادة إرسال رمز التحقق'
                : language === 'fr'
                ? 'Renvoyer le code par email'
                : 'Resend code via email'}
            </span>
          </button>

          {/* Fallback to standard verification link if needed */}
          {showLinkFallback && (
            <div className="pt-2 space-y-1.5">
              <button
                type="button"
                onClick={handleFallbackLinkVerification}
                className="w-full py-1.5 text-[11px] text-zinc-400 hover:text-indigo-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>
                  {isAr
                    ? 'إرسال رابط تأكيد بديل عبر Firebase'
                    : 'Envoyer un lien de confirmation Firebase'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleManualCheckLink}
                className="w-full py-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {isAr ? 'نقرت على الرابط بالفعل' : 'J’ai déjà cliqué sur le lien'}
              </button>
            </div>
          )}

          {/* Change email / Logout */}
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 px-4 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? 'استخدام بريد إلكتروني آخر'
                : language === 'fr'
                ? 'Utiliser un autre compte'
                : 'Use another email'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
