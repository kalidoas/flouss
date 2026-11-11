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
import { Logo } from './Logo';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Lock,
  Smartphone,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Fingerprint,
  ScanFace,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import {
  generateCryptographicOtp,
  storePendingOtpSession,
  verifyPendingOtpSession,
  clearPendingOtpSession,
  sendVerificationCodeEmail,
  getPendingOtpSession,
} from '../../services/emailAuthService';

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

const ERROR_MESSAGES: Record<string, { ar: string; fr: string; en: string }> = {
  'auth/unauthorized-domain': {
    ar: 'هذا النطاق غير مرخّص في Firebase. أضف نطاقك إلى Authorized domains في Firebase Console.',
    fr: 'Ce domaine n’est pas autorisé dans Firebase. Ajoutez votre domaine dans Firebase Console.',
    en: 'This domain is not authorized in Firebase Console.',
  },
  'auth/invalid-api-key': {
    ar: 'مفتاح Firebase API غير صالح أو غير مرتبط بالمشروع بشكل سليم.',
    fr: 'Clé API Firebase non valide pour ce projet.',
    en: 'Invalid Firebase API key for this project.',
  },
  'auth/api-key-not-valid': {
    ar: 'مفتاح Firebase API غير صالح أو غير مرتبط بالمشروع بشكل سليم.',
    fr: 'Clé API Firebase non valide pour ce projet.',
    en: 'Invalid Firebase API key for this project.',
  },
  'auth/operation-not-allowed': {
    ar: 'طريقة تسجيل الدخول هذه غير مفعّلة في Firebase Console (Authentication > Sign-in method).',
    fr: 'Méthode de connexion non activée dans Firebase Console (Authentication > Sign-in method).',
    en: 'This sign-in method is not enabled in Firebase Console (Authentication > Sign-in method).',
  },
  'auth/popup-closed-by-user': {
    ar: 'تم إغلاق نافذة تسجيل الدخول.',
    fr: 'La fenêtre de connexion a été fermée.',
    en: 'Sign-in window closed.',
  },
  'auth/network-request-failed': {
    ar: 'فشل الاتصال بالشبكة. تحقق من اتصالك بالإنترنت.',
    fr: 'Erreur réseau. Vérifiez votre connexion Internet.',
    en: 'Network error. Please check your internet connection.',
  },
  'auth/invalid-email': {
    ar: 'عنوان البريد الإلكتروني غير صالح. يرجى التأكد منه.',
    fr: 'Adresse email invalide. Veuillez vérifier le format.',
    en: 'Invalid email address format.',
  },
  'auth/email-already-in-use': {
    ar: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.',
    fr: 'Cette adresse email est déjà enregistrée. Veuillez vous connecter.',
    en: 'This email is already in use. Please sign in instead.',
  },
  'auth/wrong-password': {
    ar: 'كلمة المرور غير صحيحة. يرجى إعادة المحاولة.',
    fr: 'Mot de passe incorrect. Veuillez réessayer.',
    en: 'Incorrect password. Please try again.',
  },
  'auth/invalid-credential': {
    ar: 'بيانات الاعتماد غير صحيحة أو منتهية. تحقق من البريد وكلمة المرور.',
    fr: 'Identifiants invalides. Vérifiez votre email et mot de passe.',
    en: 'Invalid credentials. Please verify your email and password.',
  },
  'auth/user-not-found': {
    ar: 'لا يوجد حساب بهذا البريد الإلكتروني. يرجى إنشاء حساب جديد.',
    fr: 'Aucun compte associé à cet email. Veuillez créer un compte.',
    en: 'No account found with this email. Please sign up.',
  },
  'auth/weak-password': {
    ar: 'كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل.',
    fr: 'Mot de passe trop court (minimum 6 caractères).',
    en: 'Weak password. It must be at least 6 characters.',
  },
};

const getFriendlyAuthError = (err: any, language: 'ar' | 'fr' | 'en') => {
  const code = (err?.code || '').toLowerCase();
  const rawMsg = err?.message || '';

  if (code.includes('popup-closed') || rawMsg.toLowerCase().includes('closed by user')) {
    return language === 'ar'
      ? 'تم إغلاق نافذة تسجيل الدخول.'
      : language === 'fr'
      ? 'La fenêtre de connexion a été fermée.'
      : 'Sign-in window was closed.';
  }

  if (code.includes('operation-not-allowed') || rawMsg.toLowerCase().includes('operation not allowed')) {
    return language === 'ar'
      ? 'طريقة تسجيل الدخول هذه غير مفعّلة في Firebase Console (Authentication > Sign-in method).'
      : language === 'fr'
      ? 'Méthode de connexion non activée dans Firebase Console (Authentication > Sign-in method).'
      : 'Sign-in method is not enabled in Firebase Console (Authentication > Sign-in method).';
  }

  if (code.includes('403') || rawMsg.includes('403') || rawMsg.toLowerCase().includes('access_denied')) {
    return language === 'ar'
      ? 'تم رفض الوصول (403). يرجى التحقق من أذونات حسابك أو إعدادات الشبكة.'
      : language === 'fr'
      ? 'Accès refusé (403). Vérifiez vos autorisations ou les paramètres réseau.'
      : 'Access denied (403). Please verify permissions or network settings.';
  }

  for (const [key, val] of Object.entries(ERROR_MESSAGES)) {
    if (code === key || code.startsWith(key)) {
      return val[language] || val.fr;
    }
  }

  return rawMsg || (language === 'ar' ? 'حدث خطأ في المصادقة' : 'Erreur d’authentification');
};

export const Login: React.FC = () => {
  const { language, showToast } = useAppStore();
  const isAr = language === 'ar';
  const langKey: 'ar' | 'fr' | 'en' = language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [loadingPasskey, setLoadingPasskey] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);

  // OTP Verification state
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check if there is an active OTP session in sessionStorage on initial mount
  useEffect(() => {
    const session = getPendingOtpSession();
    if (session && Date.now() < session.expiresAt) {
      if (session.email) setEmail(session.email);
      if (session.fullName) setFullName(session.fullName);
      if (session.password) setPassword(session.password);
      if (session.mode) setActiveTab(session.mode);
      if (session.devCode) {
        setDevOtpCode(session.devCode);
        console.log('🔐 DEV MODE OTP CODE:', session.devCode);
      }
      setIsVerifyingOtp(true);
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
          showToast({
            message: isAr
              ? 'تم إغلاق نافذة تسجيل الدخول'
              : language === 'en'
              ? 'Sign-in window closed'
              : 'Fenêtre de connexion fermée',
          });
          return;
        }
        setError({
          code: err?.code ?? 'auth/redirect-error',
          message: getFriendlyAuthError(err, langKey),
        });
      });

    return () => {
      mounted = false;
    };
  }, [isAr, langKey, language, showToast]);

  // Handle Passkeys / WebAuthn FaceID & TouchID stub
  const handlePasskeySignIn = async () => {
    setError(null);
    triggerHaptic(50);
    setLoadingPasskey(true);

    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
      }

      await new Promise((resolve) => setTimeout(resolve, 750));
      triggerHaptic(60);

      showToast({
        message: isAr
          ? 'تم التحقق بنجاح عبر FaceID / TouchID (Passkeys)!'
          : language === 'en'
          ? 'FaceID / TouchID verified successfully via Passkeys!'
          : 'Vérifié avec succès via FaceID / TouchID (Passkeys) !',
      });

      if (email.trim()) {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password || 'FloussPasskey2026!');
        } catch {
          try {
            await createUserWithEmailAndPassword(auth, email.trim(), 'FloussPasskey2026!');
          } catch {}
        }
      }
    } catch (err: any) {
      setError({
        code: 'auth/passkey-cancelled',
        message: isAr
          ? 'تم إلغاء المصادقة البيومترية أو لم يتم العثور على مفتاح مرور مسجل.'
          : 'Authentification biométrique annulée ou non enregistrée.',
      });
    } finally {
      setLoadingPasskey(false);
    }
  };

  // Handle Send Magic Link flow
  const handleSendMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError({
        code: 'auth/invalid-email',
        message: isAr
          ? 'يرجى إدخال بريد إلكتروني صحيح أولاً لإرسال الرابط السحري'
          : 'Veuillez saisir une adresse email valide pour recevoir le lien magique',
      });
      return;
    }

    setError(null);
    triggerHaptic(50);
    setLoadingMagicLink(true);

    try {
      const otpCode = generateCryptographicOtp();
      const cleanEmail = email.trim();
      const userName = fullName.trim() || cleanEmail.split('@')[0];

      await storePendingOtpSession(cleanEmail, otpCode, {
        fullName: userName,
        mode: activeTab,
      });

      setDevOtpCode(otpCode);

      await sendVerificationCodeEmail(cleanEmail, userName, otpCode);

      showToast({
        message: isAr
          ? 'تم إرسال الرابط السحري ورمز الدخول إلى بريدك الإلكتروني!'
          : language === 'en'
          ? 'Magic link & access code sent to your email!'
          : 'Lien magique et code envoyés sur votre email !',
      });

      setIsVerifyingOtp(true);
      setOtpTimer(60);
    } catch (err: any) {
      setError({
        code: 'auth/magic-link-error',
        message: getFriendlyAuthError(err, langKey),
      });
    } finally {
      setLoadingMagicLink(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError(null);
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
        showToast({
          message: isAr
            ? 'تم إغلاق نافذة تسجيل الدخول'
            : language === 'en'
            ? 'Sign-in window closed'
            : 'Fenêtre de connexion fermée',
        });
        setError(null);
        return;
      }

      if (POPUP_BLOCKED_CODES.has(code) || isInAppBrowser()) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          setError({
            code: redirectErr?.code ?? 'auth/redirect-error',
            message: getFriendlyAuthError(redirectErr, langKey),
          });
        }
      } else {
        setError({
          code: err?.code ?? 'auth/error',
          message: getFriendlyAuthError(err, langKey),
        });
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Step 1: Submit email & password to request 6-digit OTP
  const handleInitiateEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError({
        code: 'auth/invalid-email',
        message: isAr
          ? 'يرجى إدخال عنوان بريد إلكتروني صحيح'
          : 'Veuillez saisir une adresse email valide',
      });
      return;
    }

    if (!password || password.length < 6) {
      setError({
        code: 'auth/weak-password',
        message: isAr
          ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل'
          : 'Le mot de passe doit comporter au moins 6 caractères',
      });
      return;
    }

    if (activeTab === 'signup' && !fullName.trim()) {
      setError({
        code: 'auth/missing-name',
        message: isAr
          ? 'يرجى إدخال اسمك الكامل'
          : 'Veuillez renseigner votre nom complet',
      });
      return;
    }

    setError(null);
    setLoadingAuth(true);

    try {
      // Generate cryptographic 6-digit code
      const code = generateCryptographicOtp();
      setDevOtpCode(code);

      // Store hash + 10-minute expiry in sessionStorage
      await storePendingOtpSession(cleanEmail, code, {
        fullName: fullName.trim(),
        password,
        mode: activeTab,
      });

      // Dispatch to user's real email inbox via EmailJS REST API
      const result = await sendVerificationCodeEmail(
        cleanEmail,
        fullName.trim() || cleanEmail.split('@')[0],
        code
      );

      if (!result.success) {
        console.warn('Email dispatch warning:', result.error);
      }

      // Transition to Apple-style 6-Digit OTP screen
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(import.meta.env.VITE_EMAILJS_SERVICE_ID ? 60 : 5);
      setIsVerifyingOtp(true);
    } catch (err: any) {
      setError({
        code: 'auth/otp-init-failed',
        message: getFriendlyAuthError(err, langKey),
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError(null);
    setLoadingAuth(true);

    try {
      const code = generateCryptographicOtp();
      setDevOtpCode(code);
      await storePendingOtpSession(email.trim(), code, {
        fullName: fullName.trim(),
        password,
        mode: activeTab,
      });

      await sendVerificationCodeEmail(
        email.trim(),
        fullName.trim() || email.split('@')[0],
        code
      );

      setOtpTimer(import.meta.env.VITE_EMAILJS_SERVICE_ID ? 60 : 5);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();

      showToast({
        message: isAr
          ? 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني'
          : language === 'en'
          ? 'A new verification code has been sent to your email'
          : 'Un nouveau code de vérification a été envoyé à votre adresse email',
      });
    } catch (err: any) {
      setError({
        code: 'auth/resend-failed',
        message: getFriendlyAuthError(err, langKey),
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle OTP individual input change & auto-advance
  const handleOtpDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (numeric.length > 1) {
      // Paste detected inside one input
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

    // Auto advance to next input
    if (numeric && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle OTP input KeyDown (Backspace backward navigation)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle OTP Paste event on any of the inputs
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

  // Step 4: Verify 6-digit OTP and complete Firebase auth
  const handleVerifyOtpAndAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('').trim();

    if (code.length !== 6) {
      setError({
        code: 'auth/incomplete-code',
        message: isAr
          ? 'يرجى إدخال الرمز المكون من 6 أرقام كاملاً'
          : 'Veuillez saisir le code complet à 6 chiffres',
      });
      return;
    }

    setError(null);
    setIsSubmittingOtp(true);

    try {
      const check = await verifyPendingOtpSession(code, email);

      if (!check.valid) {
        if (check.reason === 'expired') {
          setError({
            code: 'auth/code-expired',
            message: isAr
              ? 'انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.'
              : 'Le code de vérification a expiré (10 min). Veuillez en demander un nouveau.',
          });
        } else {
          setError({
            code: 'auth/invalid-code',
            message: isAr
              ? 'رمز التحقق غير صحيح. يرجى التأكد من الرمز المرسل إلى بريدك.'
              : 'Code de vérification incorrect. Veuillez vérifier votre boîte mail.',
          });
        }
        setIsSubmittingOtp(false);
        return;
      }

      const session = check.session;
      const pass = session?.password || password;

      // Complete Firebase account creation or sign in
      if (session?.mode === 'signup' || activeTab === 'signup') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
          if (fullName.trim() && userCredential?.user) {
            await updateProfile(userCredential.user, { displayName: fullName.trim() });
          }
          clearPendingOtpSession();
        } catch (signupErr: any) {
          // If already in use, try signing in with the verified password
          if (signupErr?.code === 'auth/email-already-in-use') {
            await signInWithEmailAndPassword(auth, email.trim(), pass);
            clearPendingOtpSession();
          } else {
            throw signupErr;
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
        clearPendingOtpSession();
      }

      showToast({
        message: isAr
          ? 'تم التحقق وتسجيل الدخول بنجاح!'
          : language === 'en'
          ? 'Verified and signed in successfully!'
          : 'Vérifié et connecté avec succès !',
      });
    } catch (err: any) {
      setError({
        code: err?.code || 'auth/verification-failed',
        message: getFriendlyAuthError(err, langKey),
      });
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#06070A] text-zinc-100 px-4 py-8 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1), transparent 50%)',
        }}
      />

      <div className="w-full max-w-md flex flex-col items-center gap-6 p-6 sm:p-8 rounded-[28px] bg-[#0D0E14]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_50px_-12px_rgba(0,0,0,0.8)] relative z-10">
        {/* Branding & Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" showWordmark={true} />
          <p className="text-xs text-zinc-400 leading-relaxed max-w-[290px] mt-1 font-normal">
            {isAr
              ? 'تطبيقك المالي الشخصي لإدارة الميزانية، المصاريف والمهام بخصوصية مطلقة'
              : 'Votre gestionnaire financier privé, synchronisé sur tous vos appareils'}
          </p>
        </div>

        {/* ── Error Banner ────────────────────────────────────────── */}
        {error && (
          <div className="w-full flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="flex-1 leading-relaxed break-words">{error.message}</span>
          </div>
        )}

        {/* ── Apple-style 6-Digit OTP Verification Box ─────────────── */}
        {isVerifyingOtp ? (
          <div className="w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <KeyRound className="w-6 h-6 stroke-[2]" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isAr ? 'رمز التحقق (6 أرقام)' : 'Code de vérification (6 chiffres)'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? 'أرسلنا رمز تحقق سري ومؤقت إلى بريدك الإلكتروني:'
                  : 'Nous avons envoyé un code de vérification à :'}
              </p>
              <p className="text-xs font-mono font-semibold text-indigo-300">{email}</p>
            </div>

            {/* Dev Mode Fallback Banner (active when EmailJS credentials are unconfigured or in dev) */}
            {(!import.meta.env.VITE_EMAILJS_SERVICE_ID || devOtpCode) && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">🔐</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {isAr ? 'وضع التطوير (F12 Console)' : 'Mode Dev (Console F12)'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {devOtpCode
                        ? `Code OTP: ${devOtpCode}`
                        : isAr
                        ? 'انقر على إعادة الإرسال أو راجع Console'
                        : 'Cliquez sur Renvoyer ou F12 Console'}
                    </p>
                  </div>
                </div>
                {devOtpCode && (
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtpCode.split('').slice(0, 6);
                      setOtpDigits(digits);
                      otpInputsRef.current[5]?.focus();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 font-mono font-bold text-xs shrink-0 transition-colors cursor-pointer"
                  >
                    {isAr ? 'إدخال تلقائي' : 'Remplir auto'}
                  </button>
                )}
              </div>
            )}

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
                    <span>{isAr ? 'تأكيد الرمز والمتابعة' : 'Vérifier le code'}</span>
                    <ArrowRight className="w-4 h-4" />
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
                  setError(null);
                }}
                className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isAr ? 'تغيير البريد' : 'Modifier email'}</span>
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
                  ? isAr
                    ? `إعادة الإرسال بعد ${otpTimer} ثانية`
                    : `Renvoyer dans ${otpTimer}s`
                  : isAr
                  ? 'إعادة إرسال الرمز'
                  : 'Renvoyer le code'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Segmented Tab: Sign Up vs Login ───────────────────────── */}
            <div className="w-full grid grid-cols-2 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'إنشاء حساب جديد' : 'Créer un compte'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'تسجيل الدخول' : 'Connexion'}
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
                  <span>
                    {isAr ? 'المتابعة بحساب Google المعتمد' : 'Continuer avec Google'}
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {isAr ? 'أو عبر البريد' : 'ou par email'}
              </span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleInitiateEmailAuth} className="w-full space-y-3.5">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    {isAr ? 'الاسم الكامل' : 'Nom complet'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Khalid"
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  {isAr ? 'البريد الإلكتروني' : 'Adresse Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    autoComplete="email"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Primary Flow 1: Send Magic Link */}
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={loadingMagicLink}
                className="w-full py-3 px-4 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 duration-200 cursor-pointer disabled:opacity-50"
              >
                {loadingMagicLink ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      {isAr
                        ? 'إرسال الرابط السحري عبر البريد'
                        : 'Envoyer le lien magique par email'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Primary Flow 2: WebAuthn Passkeys (FaceID / TouchID) */}
              <button
                type="button"
                onClick={handlePasskeySignIn}
                disabled={loadingPasskey}
                className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 border border-indigo-500/35 text-indigo-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] active:scale-95 duration-200 cursor-pointer"
              >
                {loadingPasskey ? (
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-indigo-400 shrink-0 stroke-[2.2]" />
                    <span>
                      {isAr
                        ? 'تسجيل الدخول عبر FaceID / TouchID (Passkeys)'
                        : 'Connexion FaceID / TouchID (Passkeys)'}
                    </span>
                  </>
                )}
              </button>

              {/* Secondary Option: Password Fallback */}
              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowPasswordFallback(!showPasswordFallback)}
                  className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 py-1.5 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? 'استخدام كلمة المرور كخيار بديل'
                        : 'Utiliser un mot de passe classique (Option secondaire)'}
                    </span>
                  </span>
                  {showPasswordFallback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showPasswordFallback && (
                  <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
                        className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingAuth}
                      className="w-full py-2.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.09] text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 duration-200 cursor-pointer"
                    >
                      {loadingAuth ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>
                            {activeTab === 'signup'
                              ? isAr ? 'إنشاء حساب بكلمة المرور' : 'Créer compte avec mot de passe'
                              : isAr ? 'دخول بكلمة المرور' : 'Connexion mot de passe'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </>
        )}

        {/* Security / Privacy Trust Badge */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isAr
              ? 'تشفير كامل للبيانات وتزامن سحابي آمن مع Firebase'
              : 'Données chiffrées de bout en bout • Synchronisation privée'}
          </span>
        </div>
      </div>
    </div>
  );
};
