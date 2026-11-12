import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Logo } from '../common/Logo';
import { Mail, RefreshCw, CheckCircle2, LogOut, ArrowRight, AlertCircle } from 'lucide-react';

export const EmailVerificationScreen: React.FC = () => {
  const { language, reloadFirebaseUser, logout, firebaseUser } = useAppStore();
  const tAuth = translations[language].auth;
  const isAr = language === 'ar';

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const email = firebaseUser?.email || auth.currentUser?.email || '';

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setChecking(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await reloadFirebaseUser();
      const currentUser = auth.currentUser;
      if (!currentUser?.emailVerified) {
        setErrorMessage(
          isAr
            ? 'لم يتم تأكيد البريد الإلكتروني بعد. يرجى النقر على الرابط في رسالتك أولاً.'
            : language === 'fr'
            ? 'Email non encore vérifié. Veuillez cliquer sur le lien reçu dans votre boîte de réception.'
            : 'Email not verified yet. Please click the confirmation link in your email first.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || tAuth.networkError);
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setCooldown(60);
        setStatusMessage(
          isAr
            ? 'تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.'
            : language === 'fr'
            ? 'Un nouvel email de confirmation a été envoyé avec succès.'
            : 'A new confirmation email has been sent successfully.'
        );
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/too-many-requests') {
        setErrorMessage(
          isAr
            ? 'يرجى الانتظار قليلاً قبل المحاولة مجدداً.'
            : language === 'fr'
            ? 'Trop de requêtes. Veuillez patienter avant de réessayer.'
            : 'Too many requests. Please wait a moment before trying again.'
        );
      } else {
        setErrorMessage(err?.message || tAuth.networkError);
      }
    } finally {
      setResending(false);
    }
  };

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

      <div className="w-full max-w-md flex flex-col items-center gap-6 p-6 sm:p-8 rounded-[28px] bg-[#0D0E14]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] relative z-10 text-center">
        
        {/* Header Logo */}
        <Logo size="md" showWordmark={true} />

        {/* Mail Icon with ambient ring */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-lg">
            <Mail className="w-8 h-8 stroke-[1.75]" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-sm -z-10 animate-pulse" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isAr
              ? 'تحقق من بريدك الإلكتروني'
              : language === 'fr'
              ? 'Vérifiez votre adresse email'
              : 'Verify your email'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {isAr
              ? 'لقد أرسلنا رابط تأكيد إلى:'
              : language === 'fr'
              ? 'Nous avons envoyé un lien de confirmation à :'
              : 'We have sent a verification link to:'}
          </p>
          <div className="inline-block py-1 px-3 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-mono font-semibold text-indigo-300">
            {email}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
            {isAr
              ? 'يرجى فتح الرسالة والنقر على الرابط لتفعيل حسابك ومتابعة إعداد مساحة العمل.'
              : language === 'fr'
              ? 'Cliquez sur le lien reçu dans votre email pour activer votre compte et sécuriser votre espace.'
              : 'Click the link in the email to activate your account and continue setting up your workspace.'}
          </p>
        </div>

        {/* Messages */}
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

        {/* Primary Action: I Verified */}
        <div className="w-full space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full py-3 px-4 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
          >
            {checking ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isAr
                    ? 'لقد قمت بالتأكيد'
                    : language === 'fr'
                    ? 'J’ai vérifié mon email'
                    : 'I have verified my email'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </>
            )}
          </button>

          {/* Secondary Action: Resend Email */}
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 px-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>
              {cooldown > 0
                ? isAr
                  ? `إعادة الإرسال بعد (${cooldown} ثانية)`
                  : language === 'fr'
                  ? `Renvoyer dans ${cooldown}s`
                  : `Resend in ${cooldown}s`
                : isAr
                ? 'إعادة إرسال الرابط'
                : language === 'fr'
                ? 'Renvoyer l’email de confirmation'
                : 'Resend confirmation email'}
            </span>
          </button>

          {/* Tertiary Action: Use another account / Logout */}
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 px-4 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? 'استخدام بريد إلكتروني آخر'
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
