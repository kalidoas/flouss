import React, { useEffect, useState, useRef } from 'react';
import { auth, googleProvider, isFirebaseConfigured } from '../../lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from '@firebase/auth';
import { setStoredGoogleAccessToken } from '../../services/googleCalendar';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Logo } from './Logo';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  RotateCw,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import {
  generateCryptographicOtp,
  storePendingOtpSession,
  verifyPendingOtpSession,
  clearPendingOtpSession,
  sendVerificationCodeEmail,
  getPendingOtpSession,
  getOtpResendCooldownSeconds,
} from '../../services/emailAuthService';
import { Language } from '../../types';

const POPUP_BLOCKED_CODES = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
]);

export const isInAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|Snapchat|Line|Messenger/i.test(ua);
};

export const Login: React.FC = () => {
  const { language, setLanguage, showToast } = useAppStore();
  const tAuth = translations[language].auth;
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification state
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check if there is an active OTP session in sessionStorage on initial mount
  useEffect(() => {
    const session = getPendingOtpSession();
    if (session && Date.now() < session.expiresAt) {
      if (session.email) setEmail(session.email);
      if (session.fullName) setFullName(session.fullName);
      if (session.password) setPassword(session.password);
      if (session.mode) setActiveTab(session.mode);
      setIsVerifyingOtp(true);
      const remainingCooldown = getOtpResendCooldownSeconds();
      setOtpTimer(remainingCooldown > 0 ? remainingCooldown : 0);
    }
  }, []);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerifyingOtp && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVerifyingOtp, otpTimer]);

  // Focus first OTP input when entering OTP screen
  useEffect(() => {
    if (isVerifyingOtp) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [isVerifyingOtp]);

  // Handle Google Redirect Result on mount
  useEffect(() => {
    let mounted = true;
    getRedirectResult(auth)
      .then((res: any) => {
        if (!mounted || !res) return;
        try {
          const credential = GoogleAuthProvider.credentialFromResult(res);
          if (credential?.accessToken) {
            setStoredGoogleAccessToken(credential.accessToken);
          }
        } catch {}
      })
      .catch((err: any) => {
        if (!mounted) return;
        const code = err?.code || '';
        if (code === 'auth/popup-closed-by-user') {
          return;
        }
        setErrorMessage(tAuth.networkError);
      });

    return () => {
      mounted = false;
    };
  }, [tAuth]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoadingGoogle(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      try {
        const credential = GoogleAuthProvider.credentialFromResult(res);
        if (credential?.accessToken) {
          setStoredGoogleAccessToken(credential.accessToken);
        }
      } catch {}
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      const isPopupClosed =
        code === 'auth/popup-closed-by-user' ||
        msg.includes('popup-closed-by-user') ||
        msg.toLowerCase().includes('closed by user');

      if (isPopupClosed) {
        setErrorMessage(null);
        return;
      }

      if (POPUP_BLOCKED_CODES.has(code) || isInAppBrowser()) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          setErrorMessage(tAuth.networkError);
        }
      } else {
        setErrorMessage(tAuth.networkError);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Handle Submit: Login vs Signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(tAuth.invalidEmail);
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(tAuth.weakPassword);
      return;
    }

    setErrorMessage(null);
    setLoadingAuth(true);

    if (activeTab === 'login') {
      // ── LOGIN FLOW: Validate password FIRST! ───────────────────────
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        // Success: Firebase Auth listener handles the rest
      } catch (err: any) {
        const errCode = err?.code || '';
        console.warn('[Flouss Auth] Sign in failed:', errCode);
        if (
          errCode === 'auth/wrong-password' ||
          errCode === 'auth/user-not-found' ||
          errCode === 'auth/invalid-credential' ||
          errCode === 'auth/invalid-login-credentials'
        ) {
          setErrorMessage(tAuth.incorrectCredentials);
        } else if (errCode === 'auth/network-request-failed') {
          setErrorMessage(tAuth.networkError);
        } else {
          setErrorMessage(tAuth.incorrectCredentials);
        }
      } finally {
        setLoadingAuth(false);
      }
    } else {
      // ── SIGNUP FLOW: Require name & send verification OTP ──────────
      if (!fullName.trim()) {
        setErrorMessage(tAuth.missingName);
        setLoadingAuth(false);
        return;
      }

      try {
        const code = generateCryptographicOtp();
        await storePendingOtpSession(cleanEmail, code, {
          fullName: fullName.trim(),
          password,
          mode: 'signup',
        });

        const result = await sendVerificationCodeEmail(
          cleanEmail,
          fullName.trim() || cleanEmail.split('@')[0],
          code
        );

        if (!result.success) {
          setErrorMessage(result.error || tAuth.sendFailed);
          setLoadingAuth(false);
          return;
        }

        setOtpDigits(['', '', '', '', '', '']);
        setOtpTimer(60);
        setIsVerifyingOtp(true);
      } catch (err: any) {
        setErrorMessage(tAuth.sendFailed);
      } finally {
        setLoadingAuth(false);
      }
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setErrorMessage(null);
    setLoadingAuth(true);

    try {
      const code = generateCryptographicOtp();
      await storePendingOtpSession(email.trim(), code, {
        fullName: fullName.trim(),
        password,
        mode: activeTab,
      });

      const result = await sendVerificationCodeEmail(
        email.trim(),
        fullName.trim() || email.split('@')[0],
        code
      );

      if (!result.success) {
        setErrorMessage(result.error || tAuth.sendFailed);
        return;
      }

      setOtpTimer(60);
      showToast({
        message: isAr
          ? 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني'
          : language === 'fr'
          ? 'Un nouveau code a été envoyé à votre adresse email'
          : 'A new code has been sent to your email',
      });
    } catch {
      setErrorMessage(tAuth.sendFailed);
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle OTP digit inputs
  const handleOtpDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (numeric.length > 1) {
      const pasted = numeric.slice(0, 6).split('');
      pasted.forEach((ch, idx) => {
        newDigits[idx] = ch;
      });
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

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    pastedData.split('').forEach((ch, idx) => {
      newDigits[idx] = ch;
    });
    setOtpDigits(newDigits);

    const nextIdx = Math.min(5, pastedData.length);
    otpInputsRef.current[nextIdx]?.focus();
  };

  // Verify 6-digit OTP and complete Account Creation
  const handleVerifyOtpAndAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('').trim();

    if (code.length !== 6) {
      setErrorMessage(tAuth.invalidCode.replace('{remaining}', '5'));
      return;
    }

    setErrorMessage(null);
    setIsSubmittingOtp(true);

    try {
      const check = await verifyPendingOtpSession(code, email);

      if (!check.valid) {
        if (check.reason === 'expired') {
          setErrorMessage(tAuth.codeExpired);
        } else if (check.reason === 'max_attempts_exceeded') {
          setErrorMessage(tAuth.maxAttemptsExceeded);
        } else {
          setErrorMessage(
            tAuth.invalidCode.replace('{remaining}', String(check.attemptsRemaining ?? 0))
          );
        }
        setIsSubmittingOtp(false);
        return;
      }

      const session = check.session;
      const cleanEmail = email.trim();
      const pwd = session?.password || password;

      // Create new Firebase account
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pwd);
      if (session?.fullName || fullName.trim()) {
        try {
          await updateProfile(userCred.user, {
            displayName: session?.fullName || fullName.trim(),
          });
        } catch {}
      }

      clearPendingOtpSession();
    } catch (err: any) {
      const errCode = err?.code || '';
      if (errCode === 'auth/email-already-in-use') {
        setErrorMessage(tAuth.emailAlreadyInUse);
        setIsVerifyingOtp(false);
        setActiveTab('login');
      } else {
        setErrorMessage(err?.message || tAuth.networkError);
      }
    } finally {
      setIsSubmittingOtp(false);
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

      <div className="w-full max-w-md flex flex-col items-center gap-5 p-6 sm:p-8 rounded-[28px] bg-[#0D0E14]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] relative z-10">
        
        {/* Header with Language Switcher */}
        <div className="w-full flex items-center justify-between">
          <Logo size="md" showWordmark={true} />
          <div className="flex items-center gap-1 rounded-full p-1 bg-white/[0.04] border border-white/[0.08]">
            {(['fr', 'ar', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-zinc-400 text-center leading-relaxed font-normal">
          {translations[language].tagline}
        </p>

        {/* Error Banner */}
        {errorMessage && (
          <div className="w-full flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="flex-1 leading-relaxed break-words">{errorMessage}</span>
          </div>
        )}

        {/* ── 6-Digit OTP Verification Screen ── */}
        {isVerifyingOtp ? (
          <div className="w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <KeyRound className="w-6 h-6 stroke-[2]" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {tAuth.otpTitle}
              </h2>
              <p className="text-xs text-zinc-400">
                {tAuth.otpSentTo}
              </p>
              <p className="text-xs font-mono font-semibold text-indigo-300">{email}</p>
            </div>

            {/* 6 Individual Inputs Grid */}
            <form onSubmit={handleVerifyOtpAndAuthenticate} className="space-y-4">
              <div
                dir="ltr"
                className="flex items-center justify-center gap-2 sm:gap-2.5 my-2"
                onPaste={handleOtpPaste}
              >
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
                    className="w-11 h-13 sm:w-12 sm:h-14 rounded-2xl border border-white/[0.12] bg-white/[0.04] text-center text-xl sm:text-2xl font-bold font-mono text-white focus:border-indigo-400 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                ))}
              </div>

              {/* Verify CTA Button */}
              <button
                type="submit"
                disabled={isSubmittingOtp || otpDigits.join('').length !== 6}
                className="w-full py-3 px-4 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
              >
                {isSubmittingOtp ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{tAuth.verifyAndContinue}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Countdown & Back Button */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setIsVerifyingOtp(false);
                  setErrorMessage(null);
                }}
                className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{tAuth.changeEmail}</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpTimer > 0 || loadingAuth}
                className={`font-medium transition-colors cursor-pointer ${
                  otpTimer > 0
                    ? 'text-zinc-500 cursor-not-allowed'
                    : 'text-indigo-400 hover:text-indigo-300'
                }`}
              >
                {otpTimer > 0
                  ? tAuth.resendIn.replace('{seconds}', String(otpTimer))
                  : tAuth.resendCode}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Segmented Tab: Sign In vs Sign Up ───────────────────────── */}
            <div className="w-full grid grid-cols-2 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tAuth.signInTab}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tAuth.signUpTab}
              </button>
            </div>

            {/* ── Google Fast Sign-in Button ──────────────────────────── */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle || !isFirebaseConfigured}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              {loadingGoogle ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{tAuth.continueWithGoogle}</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {tAuth.orWithEmail}
              </span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* ── Email + Password Form ── */}
            <form onSubmit={handleSubmit} className="w-full space-y-3.5">
              {/* Full Name (signup only) */}
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    {tAuth.fullNameLabel}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={tAuth.fullNamePlaceholder}
                      className="w-full text-xs pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  {tAuth.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tAuth.emailPlaceholder}
                    autoComplete="email"
                    className="w-full text-xs pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  {tAuth.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tAuth.passwordPlaceholder}
                    autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
                    className="w-full text-xs pl-10 rtl:pl-10 rtl:pr-10 pr-10 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full py-3 px-4 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 duration-200 cursor-pointer disabled:opacity-50"
              >
                {loadingAuth ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {activeTab === 'signup' ? tAuth.signUpBtn : tAuth.signInBtn}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Security / Privacy Trust Badge */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{tAuth.trustBadge}</span>
        </div>
      </div>
    </div>
  );
};
