import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from './Card';
import { Skeleton } from './Primitives';
import { translations } from '../../i18n/translations';
import { auth } from '../../lib/firebase';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';

export const AppleShimmerSkeleton: React.FC = () => {
  const language = useAppStore((s) => s.language);
  const logout = useAppStore((s) => s.logout);
  const text = translations[language].common.syncingCloud;
  const isAr = language === 'ar';

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setTimedOut(false);
    const u = auth.currentUser;
    useAppStore.getState().initAuthSession(u);
  };

  if (timedOut) {
    return (
      <main
        role="alert"
        dir={isAr ? 'rtl' : 'ltr'}
        className="min-h-screen bg-canvas px-4 py-8 flex items-center justify-center font-sans"
      >
        <div className="w-full max-w-sm rounded-[28px] bg-[#0D0E14]/95 border border-white/10 p-6 sm:p-7 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-lg">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-base font-bold text-white tracking-tight mb-1.5">
            {isAr ? 'حدث خطأ أثناء تحميل البيانات' : language === 'en' ? 'Something went wrong' : 'Un problème est survenu'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            {isAr
              ? 'استغرقت المزامنة وقتاً أطول من المتوقع. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.'
              : language === 'en'
              ? 'Connecting to your workspace is taking longer than expected. Please check your network and retry.'
              : 'La connexion à votre espace prend plus de temps que prévu. Vérifiez votre connexion internet puis réessayez.'}
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isAr ? 'إعادة المحاولة' : language === 'en' ? 'Retry' : 'Réessayer'}</span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>{isAr ? 'تسجيل الخروج' : language === 'en' ? 'Sign out' : 'Se déconnecter'}</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      role="status"
      aria-busy="true"
      aria-label={text}
      className="min-h-screen bg-canvas px-4 py-8 flex items-center justify-center"
    >
      <Card className="w-full max-w-md space-y-5" padding="lg">
        <div className="space-y-2">
          <Skeleton className="w-32" />
          <Skeleton className="w-56 max-w-full" />
        </div>
        <Skeleton shape="rectangle" className="h-28 w-full" />
        <div className="space-y-2">
          <Skeleton className="w-full" />
          <Skeleton className="w-4/5" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-positive animate-pulse" />
          <span>{text}</span>
        </div>
      </Card>
    </main>
  );
};
