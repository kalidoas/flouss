import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { requestGoogleCalendarAuth } from '../../services/googleCalendar';
import { playHapticFeedback } from '../../utils/haptics';
import { Calendar, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ReconnectGoogleCalendarModal: React.FC = () => {
  const { language, showToast } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleReconnectEvent = () => {
      setIsOpen(true);
      playHapticFeedback('medium');
    };

    window.addEventListener('flouss:google-calendar-reconnect', handleReconnectEvent);
    return () => {
      window.removeEventListener('flouss:google-calendar-reconnect', handleReconnectEvent);
    };
  }, []);

  if (!isOpen) return null;

  const handleReconnect = async () => {
    setLoading(true);
    playHapticFeedback('selection');
    try {
      await requestGoogleCalendarAuth(true);
      setIsOpen(false);
      playHapticFeedback('success');
      showToast({
        message: isAr
          ? '✓ تم إعادة الاتصال بتقويم جوجل بنجاح!'
          : isEn
          ? '✓ Reconnected to Google Calendar successfully!'
          : '✓ Reconnexion à Google Calendar réussie !',
      });
    } catch (err: any) {
      playHapticFeedback('error');
      showToast({
        message: err?.message || (isAr ? 'فشلت إعادة الاتصال' : 'Échec de la reconnexion'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up">
        {/* Header with icon */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {isAr
              ? 'إعادة الاتصال بتقويم جوجل'
              : isEn
              ? 'Reconnect Google Calendar'
              : 'Reconnexion à Google Calendar'}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {isAr
              ? 'انتهت صلاحية إذن الاتصال بحسابك في تقويم جوجل. يرجى إعادة الاتصال لضمان استمرار عمل منبه الهاتف للمهام والفواتير في موعدها.'
              : isEn
              ? 'Your Google Calendar session has expired. Please reconnect to ensure phone alarms for tasks and bills continue working on time.'
              : 'Votre session Google Calendar a expiré. Veuillez vous reconnecter pour que vos alarmes de téléphone fonctionnent correctement.'}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isAr ? 'لاحقاً' : isEn ? 'Later' : 'Plus tard'}
          </button>

          <button
            type="button"
            onClick={handleReconnect}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            <span>
              {loading
                ? isAr
                  ? 'جاري الاتصال...'
                  : 'Connexion...'
                : isAr
                ? 'إعادة الاتصال الآن'
                : isEn
                ? 'Reconnect Now'
                : 'Se reconnecter'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
