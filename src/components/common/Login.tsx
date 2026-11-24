import React, { useEffect, useState } from 'react';
import { auth, googleProvider, isFirebaseConfigured } from '../../lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
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
  CheckCircle2,
} from 'lucide-react';
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
  const { language, setLanguage } = useAppStore();
  const tAuth = translations[language].auth;
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear any stale account hint on mount (no prefilling from localStorage)
  useEffect(() => {
    try {
      localStorage.removeItem('flouss_last_account_hint');
    } catch {}
  }, []);

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
        if (code === 'auth/popup-closed-by-user') return;
        setErrorMessage(tAuth.networkError);
      });

    return () => {
      mounted = false;
    };
  }, [tAuth]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingGoogle(true);

    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });

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
        } catch {
          setErrorMessage(tAuth.networkError);
        }
      } else if (code === 'auth/account-exists-with-different-credential') {
        setErrorMessage(
          isAr
            ? 'هذا البريد مسجل مسبقاً بطريقة دخول أخرى (كلمة المرور).'
            : language === 'fr'
            ? 'Ce compte existe déjà avec un autre mode de connexion (mot de passe).'
            : 'An account already exists with this email using email/password.'
        );
      } else {
        setErrorMessage(tAuth.networkError);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(tAuth.invalidEmail);
      return;
    }
    setSendingReset(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage(tAuth.resetPasswordSent);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/too-many-requests') {
        setErrorMessage(
          isAr
            ? 'يرجى الانتظار قليلاً قبل طلب رابط جديد.'
            : language === 'fr'
            ? 'Trop de requêtes. Veuillez patienter un instant.'
            : 'Too many requests. Please wait a moment.'
        );
      } else {
        // Generic success to prevent user enumeration
        setSuccessMessage(tAuth.resetPasswordSent);
      }
    } finally {
      setSendingReset(false);
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
    setSuccessMessage(null);
    setLoadingAuth(true);

    if (activeTab === 'login') {
      // ── LOGIN FLOW: Validate credentials FIRST! ────────────────────
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
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
        } else if (errCode === 'auth/too-many-requests') {
          setErrorMessage(
            isAr
              ? 'تم حظر الدخول مؤقتاً لكثرة المحاولات الخاطئة. حاول لاحقاً.'
              : language === 'fr'
              ? 'Accès temporairement bloqué suite à trop de tentatives. Réessayez plus tard.'
              : 'Access temporarily blocked due to too many attempts. Please try again later.'
          );
        } else if (errCode === 'auth/network-request-failed') {
          setErrorMessage(tAuth.networkError);
        } else {
          setErrorMessage(tAuth.incorrectCredentials);
        }
      } finally {
        setLoadingAuth(false);
      }
    } else {
      // ── SIGNUP FLOW: Native Firebase Email Verification ─────────────
      if (!fullName.trim()) {
        setErrorMessage(tAuth.missingName);
        setLoadingAuth(false);
        return;
      }

      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        try {
          await updateProfile(userCred.user, {
            displayName: fullName.trim(),
          });
        } catch {}
        // initAuthSession will pick up unverified email and transition authGate -> needsEmailVerif
      } catch (err: any) {
        const errCode = err?.code || '';
        if (errCode === 'auth/email-already-in-use') {
          setErrorMessage(tAuth.emailAlreadyInUse);
        } else if (errCode === 'auth/invalid-email') {
          setErrorMessage(tAuth.invalidEmail);
        } else if (errCode === 'auth/weak-password') {
          setErrorMessage(tAuth.weakPassword);
        } else {
          setErrorMessage(err?.message || tAuth.networkError);
        }
      } finally {
        setLoadingAuth(false);
      }
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex flex-col items-center justify-center min-h-screen bg-bg text-content px-4 py-8 relative overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1), transparent 50%)',
        }}
      />

      <div className="w-full max-w-md flex flex-col items-center gap-5 p-6 sm:p-8 rounded-[28px] bg-surface/90 backdrop-blur-2xl border border-border-strong shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] relative z-10">
        
        {/* Header with Language Switcher */}
        <div className="w-full flex items-center justify-between">
          <Logo size="md" showWordmark={true} />
          <div className="flex items-center gap-1 rounded-full p-1 bg-surface-3 border border-border-strong">
            {(['fr', 'ar', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-surface text-text-subtle shadow-xs'
                    : 'text-text-subtle hover:text-content'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-text-subtle text-center leading-relaxed font-normal">
          {translations[language].tagline}
        </p>

        {/* Error Banner */}
        {errorMessage && (
          <div className="w-full flex items-start gap-2.5 p-3.5 rounded-2xl bg-negative/10 border border-negative/20 text-negative text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-negative mt-0.5" />
            <span className="flex-1 leading-relaxed break-words">{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="w-full flex items-start gap-2.5 p-3.5 rounded-2xl bg-positive/10 border border-positive/20 text-positive text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-positive mt-0.5" />
            <span className="flex-1 leading-relaxed break-words">{successMessage}</span>
          </div>
        )}

        {/* ── Segmented Tab: Sign In vs Sign Up ───────────────────────── */}
        <div className="w-full grid grid-cols-2 p-1 rounded-full bg-surface-3 border border-border-strong">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-surface text-text-subtle font-bold shadow-xs'
                : 'text-text-subtle hover:text-content'
            }`}
          >
            {tAuth.signInTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-surface text-text-subtle font-bold shadow-xs'
                : 'text-text-subtle hover:text-content'
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
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-border-strong bg-surface-3 hover:bg-surface-2 hover:border-border/[0.2] text-xs font-semibold text-accent-contrast transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
        >
          {loadingGoogle ? (
            <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="bg-info"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="bg-positive"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="bg-warning"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="bg-negative"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{tAuth.continueWithGoogle}</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-2" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-subtle">
            {tAuth.orWithEmail}
          </span>
          <div className="flex-1 h-px bg-surface-2" />
        </div>

        {/* ── Email + Password Form ── */}
        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          {/* Full Name (signup only) */}
          {activeTab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">
                {tAuth.fullNameLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-subtle absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={tAuth.fullNamePlaceholder}
                  className="w-full text-xs pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 rounded-xl border border-border-strong bg-surface-3 text-accent-contrast placeholder:text-text-subtle focus:border-accent focus:bg-surface-2 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">
              {tAuth.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-subtle absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tAuth.emailPlaceholder}
                autoComplete="email"
                className="w-full text-xs pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 rounded-xl border border-border-strong bg-surface-3 text-accent-contrast placeholder:text-text-subtle focus:border-accent focus:bg-surface-2 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                {tAuth.passwordLabel}
              </label>
              {activeTab === 'login' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="text-[11px] text-accent hover:text-accent font-medium transition-colors cursor-pointer"
                >
                  {sendingReset ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    tAuth.forgotPassword
                  )}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-subtle absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tAuth.passwordPlaceholder}
                autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
                className="w-full text-xs pl-10 rtl:pl-10 rtl:pr-10 pr-10 py-2.5 rounded-xl border border-border-strong bg-surface-3 text-accent-contrast placeholder:text-text-subtle focus:border-accent focus:bg-surface-2 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-muted p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loadingAuth}
            className="w-full py-3 px-4 rounded-full bg-surface text-text-subtle font-bold text-xs flex items-center justify-center gap-2 hover:bg-border-border transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 duration-200 cursor-pointer disabled:opacity-50"
          >
            {loadingAuth ? (
              <div className="w-4 h-4 border-2 border-bg-bg border-t-transparent rounded-full animate-spin" />
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

        {/* Security / Privacy Trust Badge */}
        <div className="flex items-center gap-2 text-[11px] text-text-subtle">
          <ShieldCheck className="w-3.5 h-3.5 text-positive shrink-0" />
          <span>{tAuth.trustBadge}</span>
        </div>
      </div>
    </div>
  );
};
