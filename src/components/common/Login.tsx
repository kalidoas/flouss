import React, { useEffect, useState } from 'react';
import { auth, googleProvider } from '../../lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { useAppStore } from '../../store/useAppStore';
import { Logo } from './Logo';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, Lock, Smartphone, User } from 'lucide-react';

const POPUP_BLOCKED_CODES = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/popup-closed-by-user',
]);

const ERROR_MESSAGES: Record<string, { ar: string; fr: string }> = {
  'auth/unauthorized-domain': {
    ar: 'هذا النطاق غير مرخّص في Firebase. أضف النطاق إلى Authorized domains في Firebase Console.',
    fr: 'Ce domaine n’est pas autorisé dans Firebase. Ajoutez localhost aux domaines autorisés.',
  },
  'auth/invalid-api-key': {
    ar: 'مفتاح Firebase API غير صالح. تحقق من إعدادات المشروع.',
    fr: 'Clé API Firebase non valide. Vérifiez la configuration du projet.',
  },
  'auth/operation-not-allowed': {
    ar: 'طريقة تسجيل الدخول هذه غير مفعّلة في Firebase Console (Authentication > Sign-in method).',
    fr: 'Méthode de connexion non activée dans Firebase Console (Authentication > Sign-in method).',
  },
  'auth/popup-closed-by-user': {
    ar: 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية. حاول مجدداً.',
    fr: 'La fenêtre de connexion a été fermée. Veuillez réessayer.',
  },
  'auth/network-request-failed': {
    ar: 'فشل الاتصال بالشبكة. تحقق من اتصالك بالإنترنت.',
    fr: 'Erreur réseau. Vérifiez votre connexion Internet.',
  },
  'auth/invalid-email': {
    ar: 'عنوان البريد الإلكتروني غير صالح. يرجى التأكد منه.',
    fr: 'Adresse email invalide. Veuillez vérifier le format.',
  },
  'auth/expired-action-code': {
    ar: 'انتهت صلاحية رابط تسجيل الدخول هذا. يرجى طلب رابط جديد.',
    fr: 'Le lien de connexion a expiré. Veuillez en demander un nouveau.',
  },
  'auth/invalid-action-code': {
    ar: 'رابط تسجيل الدخول غير صالح أو تم استخدامه مسبقاً.',
    fr: 'Lien de connexion invalide ou déjà utilisé.',
  },
};

export const Login: React.FC = () => {
  const language = useAppStore((s: any) => s.language) || 'ar';
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [verifyingMagicLink, setVerifyingMagicLink] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  // 1. Check if user arrived via an incoming Email Magic Link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setVerifyingMagicLink(true);
      let emailForSignIn = window.localStorage.getItem('flouss_email_for_signin');
      if (!emailForSignIn) {
        emailForSignIn = window.prompt(
          isAr
            ? 'يرجى تأكيد بريدك الإلكتروني لإتمام تسجيل الدخول:'
            : 'Veuillez confirmer votre adresse email pour terminer la connexion :'
        );
      }
      if (emailForSignIn) {
        signInWithEmailLink(auth, emailForSignIn.trim(), window.location.href)
          .then(() => {
            window.localStorage.removeItem('flouss_email_for_signin');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err: any) => {
            const msg = ERROR_MESSAGES[err.code]
              ? (isAr ? ERROR_MESSAGES[err.code].ar : ERROR_MESSAGES[err.code].fr)
              : (err.message || 'Error completing email link sign in');
            setError({ code: err.code || 'auth/magic-link-error', message: msg });
          })
          .finally(() => {
            setVerifyingMagicLink(false);
          });
      } else {
        setVerifyingMagicLink(false);
      }
    }
  }, [isAr]);

  // 2. Check for redirect results (mobile popups)
  useEffect(() => {
    let isMounted = true;
    getRedirectResult(auth)
      .then((result) => {
        if (!isMounted) return;
        if (result?.user) {
          // Handled by onAuthStateChanged in App.tsx
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        const msg = ERROR_MESSAGES[err.code]
          ? (isAr ? ERROR_MESSAGES[err.code].ar : ERROR_MESSAGES[err.code].fr)
          : (err.message || 'Authentication error');
        setError({ code: err.code ?? 'auth/error', message: msg });
      });

    return () => {
      isMounted = false;
    };
  }, [isAr]);

  // 3. Resend cooldown countdown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Google 1-click Sign In / Sign Up
  const handleGoogleAuth = async () => {
    setError(null);
    setLoadingGoogle(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (POPUP_BLOCKED_CODES.has(err.code)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          const msg = ERROR_MESSAGES[redirectErr.code]
            ? (isAr ? ERROR_MESSAGES[redirectErr.code].ar : ERROR_MESSAGES[redirectErr.code].fr)
            : (redirectErr.message || 'Authentication error');
          setError({ code: redirectErr.code ?? 'auth/redirect-error', message: msg });
        }
      } else {
        const msg = ERROR_MESSAGES[err.code]
          ? (isAr ? ERROR_MESSAGES[err.code].ar : ERROR_MESSAGES[err.code].fr)
          : (err.message || 'Authentication error');
        setError({ code: err.code ?? 'auth/error', message: msg });
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Handle sending secure Email Link (Magic Link)
  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError({
        code: 'auth/invalid-email',
        message: isAr ? 'يرجى إدخال عنوان بريد إلكتروني صحيح' : 'Veuillez saisir une adresse email valide',
      });
      return;
    }

    setError(null);
    setLoadingEmail(true);

    try {
      const actionCodeSettings = {
        // Return URL back to application origin
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);

      // Save email locally to complete sign-in without prompt on return
      window.localStorage.setItem('flouss_email_for_signin', cleanEmail);
      if (fullName.trim()) {
        window.localStorage.setItem('flouss_pending_name', fullName.trim());
      }

      setEmailSent(true);
      setResendCooldown(60);
    } catch (err: any) {
      const msg = ERROR_MESSAGES[err.code]
        ? (isAr ? ERROR_MESSAGES[err.code].ar : ERROR_MESSAGES[err.code].fr)
        : (err.message || 'Error sending email link');
      setError({ code: err.code || 'auth/email-link-failed', message: msg });
    } finally {
      setLoadingEmail(false);
    }
  };

  // ── Incoming Magic Link Verification Loading Screen ────────
  if (verifyingMagicLink) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#191919] px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-4 p-8 rounded-2xl bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] shadow-xl text-center">
          <svg className="animate-spin h-9 w-9 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <h2 className="text-base font-bold text-[#37352f] dark:text-[#ecebed]">
            {isAr ? 'جاري التحقق من الرابط وإتمام الدخول...' : 'Vérification du lien de connexion...'}
          </h2>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
            {isAr ? 'لحظات وننقلك إلى لوحة التحكم الخاصة بك.' : 'Redirection vers votre tableau de bord.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#191919] px-4 py-8 transition-colors">
      <div className="w-full max-w-md flex flex-col items-center gap-6 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] shadow-xl">

        {/* App Branding & Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" showWordmark={true} />
          <p className="text-xs text-[#787774] dark:text-[#9b9a97] leading-relaxed max-w-[280px] mt-1">
            {isAr
              ? 'تطبيقك المالي الشخصي لإدارة الميزانية، المصاريف والمهام بخصوصية مطلقة'
              : 'Votre gestionnaire financier privé, synchronisé sur tous vos appareils'}
          </p>
        </div>

        {/* ── Segmented Tab: Login vs Sign Up ──────────────────────── */}
        <div className="w-full grid grid-cols-2 p-1 rounded-xl bg-[#f1f0ee] dark:bg-[#282828] border border-[#e3e2de] dark:border-[#333333]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setEmailSent(false);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-[#1c1c1c] text-[#37352f] dark:text-[#ecebed] shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-[#ecebed]'
            }`}
          >
            {isAr ? 'تسجيل الدخول (لدي حساب)' : 'Connexion (Déjà un compte)'}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setError(null);
              setEmailSent(false);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-[#1c1c1c] text-[#37352f] dark:text-[#ecebed] shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-[#ecebed]'
            }`}
          >
            {isAr ? 'إنشاء حساب جديد' : 'Créer un compte'}
          </button>
        </div>

        {/* ── Email Sent / Check Inbox State ───────────────────────── */}
        {emailSent ? (
          <div className="w-full space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-pulse">
              <Mail className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#37352f] dark:text-[#ecebed]">
                {isAr ? 'تحقق من صندوق بريدك الإلكتروني' : 'Vérifiez votre boîte de réception'}
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] leading-relaxed">
                {isAr ? 'أرسلنا رابط تسجيل دخول آمن وفوري إلى:' : 'Nous avons envoyé un lien de connexion sécurisé à :'}
              </p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono py-1">
                {email}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] text-right space-y-1.5 text-xs text-[#5f5e5b] dark:text-[#9b9a97]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isAr
                    ? 'افتح رسالتك في Gmail أو تطبيق البريد واضغط على الرابط لإتمام الدخول مباشرة بدون الحاجة لأي رمز.'
                    : 'Cliquez sur le lien reçu dans votre email pour vous connecter automatiquement sans mot de passe.'}
                </p>
              </div>
              <p className="text-[11px] text-[#9b9a97] leading-normal pt-1 border-t border-[#e3e2de]/60 dark:border-[#2f2f2f]">
                {isAr
                  ? '💡 إذا لم تجد الرسالة، يرجى فحص مجلد الرسائل غير المرغوب فيها (Spam / Courrier indésirable).'
                  : '💡 Si vous ne trouvez pas l’email, vérifiez vos dossiers Spam ou Courrier indésirable.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-[#787774] hover:text-[#37352f] dark:hover:text-[#ecebed] underline cursor-pointer"
              >
                {isAr ? '← تغيير البريد' : '← Modifier l’email'}
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loadingEmail}
                onClick={handleSendEmailLink}
                className={`font-semibold flex items-center gap-1.5 ${
                  resendCooldown > 0
                    ? 'text-[#9b9a97] cursor-not-allowed'
                    : 'text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0
                    ? `${isAr ? 'إعادة الإرسال بعد' : 'Renvoyer dans'} ${resendCooldown}s`
                    : (isAr ? 'إعادة إرسال الرابط' : 'Renvoyer le lien')}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Main Form (Login / Sign Up) ────────────────────────── */
          <div className="w-full space-y-4">

            {/* 1. Fast Google Sign-In Option */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loadingGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {loadingGoogle ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>{isAr ? 'جاري الاتصال بـ Google...' : 'Connexion Google...'}</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8H6.5C9.8 35.8 16.4 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.2C43 34.9 44 29.8 44 24c0-1.3-.1-2.7-.4-3.9z"/>
                    </svg>
                  </div>
                  <span>
                    {activeTab === 'login'
                      ? (isAr ? 'الدخول السريع بحساب Google' : 'Se connecter avec Google')
                      : (isAr ? 'إنشاء حساب بواسطة Google' : 'Créer un compte avec Google')}
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#e3e2de] dark:border-[#2f2f2f] w-full" />
              <span className="bg-white dark:bg-[#202020] px-3 text-[11px] font-medium text-[#787774] dark:text-[#9b9a97] shrink-0">
                {isAr ? 'أو عبر رابط البريد الإلكتروني الآمن' : 'ou par lien sécurisé par email'}
              </span>
            </div>

            {/* 2. Passwordless Email Link Form */}
            <form onSubmit={handleSendEmailLink} className="space-y-3">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] dark:text-[#ecebed] mb-1 text-right">
                    {isAr ? 'الاسم الكامل أو اسم العرض' : 'Nom complet ou profil'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#787774] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Khalid"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:border-emerald-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#37352f] dark:text-[#ecebed] mb-1 text-right">
                  {isAr ? 'البريد الإلكتروني' : 'Adresse Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#787774] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="votre-email@gmail.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#e3e2de] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1a1a1a] text-[#37352f] dark:text-[#ecebed] focus:border-emerald-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingEmail}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#37352f] dark:text-[#ecebed] bg-[#f1f0ee] dark:bg-[#2a2a2a] hover:bg-[#e8e7e4] dark:hover:bg-[#333333] border border-[#e3e2de] dark:border-[#383838] transition-all cursor-pointer disabled:opacity-60"
              >
                {loadingEmail ? (
                  <span>{isAr ? 'جاري إرسال الرابط...' : 'Envoi en cours...'}</span>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {activeTab === 'login'
                        ? (isAr ? 'إرسال رابط الدخول السري إلى بريدي' : 'Envoyer mon lien de connexion')
                        : (isAr ? 'إرسال رابط تفعيل الحساب' : 'Envoyer le lien d’activation')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Error Banner ─────────────────────────────────────────── */}
        {error && (
          <div className="w-full rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3 text-right">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">
              {isAr ? 'تنبيه' : 'Attention'}
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 leading-normal">{error.message}</p>
          </div>
        )}

        {/* ── Security & Cross-Device Sync Footer ───────────────────── */}
        <div className="w-full pt-4 border-t border-[#e3e2de] dark:border-[#2f2f2f] flex flex-col gap-2 text-[11px] text-[#787774] dark:text-[#9b9a97]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isAr
                ? 'مزامنة فورية: سجّل دخولك بنفس الإيميل من هاتفك أو حاسوبك لتجد كل بياناتك محفوظة.'
                : 'Synchronisation multi-appareils : Retrouvez vos données sur mobile et PC.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isAr
                ? 'خصوصية مطلقة: بياناتك المالية مشفرة وخاصة بـ UID حسابك فقط.'
                : 'Confidentialité totale : Vos finances sont isolées et chiffrées.'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
