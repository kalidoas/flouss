import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { startAlarmLoop } from '../../services/audioAlarmService';
import { playHapticFeedback } from '../../utils/haptics';
import { Bell, Clock, CheckCircle2, Moon, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { InAppAlarmEventDetail, triggerInAppAlarm } from '../../services/notificationService';

export const InAppAlarmSheet: React.FC = () => {
  const { language, notificationSettings, showToast } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';

  const [activeAlarm, setActiveAlarm] = useState<InAppAlarmEventDetail | null>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);
  const hapticIntervalRef = useRef<any>(null);

  useEffect(() => {
    const handleAlarmEvent = (e: Event) => {
      const customEvent = e as CustomEvent<InAppAlarmEventDetail>;
      if (customEvent.detail) {
        setActiveAlarm(customEvent.detail);
      }
    };

    window.addEventListener('flouss:in-app-alarm', handleAlarmEvent);
    return () => {
      window.removeEventListener('flouss:in-app-alarm', handleAlarmEvent);
    };
  }, []);

  useEffect(() => {
    if (activeAlarm) {
      // 1. Audio Loop (if sound enabled in settings)
      if (notificationSettings?.soundEnabled !== false) {
        stopAudioRef.current = startAlarmLoop(notificationSettings?.soundTone || 'chime');
      }

      // 2. Repeated Haptics every 800ms
      playHapticFeedback('rigid');
      hapticIntervalRef.current = setInterval(() => {
        playHapticFeedback('rigid');
      }, 800);
    } else {
      // Stop Audio & Haptics when cleared
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
    }

    return () => {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
    };
  }, [activeAlarm, notificationSettings]);

  if (!activeAlarm) return null;

  const handleDismiss = () => {
    setActiveAlarm(null);
    playHapticFeedback('medium');
    showToast({
      message: isAr ? 'تم إيقاف المنبه' : isEn ? 'Alarm dismissed' : 'Alarme désactivée',
    });
  };

  const handleSnooze = () => {
    const alarmToSnooze = { ...activeAlarm };
    setActiveAlarm(null);
    playHapticFeedback('selection');

    showToast({
      message: isAr
        ? 'تم تأجيل المنبه لمدة 5 دقائق ⏳'
        : isEn
        ? 'Alarm snoozed for 5 minutes ⏳'
        : 'Alarme reportée de 5 minutes ⏳',
    });

    // Schedule 5-minute snooze re-trigger
    setTimeout(() => {
      triggerInAppAlarm(alarmToSnooze);
    }, 5 * 60 * 1000);
  };

  const getEntityIcon = () => {
    switch (activeAlarm.type) {
      case 'bill':
        return <CreditCard className="w-8 h-8 text-amber-400 animate-bounce" />;
      case 'meeting':
        return <Calendar className="w-8 h-8 text-blue-400 animate-bounce" />;
      case 'task':
      default:
        return <Bell className="w-8 h-8 text-rose-400 animate-bounce" />;
    }
  };

  const getEntityLabel = () => {
    switch (activeAlarm.type) {
      case 'bill':
        return isAr ? 'فاتورة مستحقة الأداء' : isEn ? 'Due Bill / Charge' : 'Facture à échéance';
      case 'meeting':
        return isAr ? 'موعد اجتماع' : isEn ? 'Scheduled Meeting' : 'Réunion programmée';
      case 'task':
      default:
        return isAr ? 'موعد مهمة هامة' : isEn ? 'Task Reminder' : 'Rappel de tâche';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full sm:max-w-md bg-zinc-950 text-white rounded-t-3xl sm:rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up">
        {/* Pulsing Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/20 animate-pulse">
            {getEntityIcon()}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              {getEntityLabel()}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeAlarm.title}
            </h2>
            {activeAlarm.subtitle && (
              <p className="text-sm text-zinc-400">{activeAlarm.subtitle}</p>
            )}
            {activeAlarm.scheduledTime && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono text-zinc-300 mt-2">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{activeAlarm.scheduledTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Snooze 5 min */}
          <button
            type="button"
            onClick={handleSnooze}
            className="w-full py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 text-zinc-200 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Moon className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'تأجيل 5 دقائق' : isEn ? 'Snooze 5m' : 'Reporter 5 min'}</span>
          </button>

          {/* Dismiss / Complete */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? 'إيقاف المنبه' : isEn ? 'Dismiss' : 'Désactiver'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
