import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { createGoogleCalendarEvent } from '../../services/googleCalendar';
import { Calendar, Clock, Bell, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoogleCalendarAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  taskDescription?: string;
  defaultDate?: string;
  onSuccess?: (eventId: string, scheduledTime: string) => void;
}

export const GoogleCalendarAlarmModal: React.FC<GoogleCalendarAlarmModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  taskDescription,
  defaultDate,
  onSuccess,
}) => {
  const { language, showToast } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [date, setDate] = useState<string>(defaultDate || todayStr);
  const [time, setTime] = useState<string>('10:00');
  const [loading, setLoading] = useState<boolean>(false);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);

  // Quick preset shortcuts
  const applyPreset = (presetDate: string, presetTime: string) => {
    setDate(presetDate);
    setTime(presetTime);
  };

  const handleScheduleAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !date || !time) return;

    setLoading(true);
    try {
      const res = await createGoogleCalendarEvent({
        title: taskTitle.trim(),
        description: taskDescription?.trim() || 'Rappel créé depuis Flouss (Alarme native)',
        scheduledDate: date,
        scheduledTime: time,
        durationMinutes,
      });

      if (res.success && res.eventId) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });

        showToast({
          message: isAr
            ? `🔔 تم جدولة المنبه على هاتفك بنجاح في ${time} !`
            : isEn
            ? `🔔 Alarm scheduled on your phone for ${time}!`
            : `🔔 Alarme programmée sur votre téléphone à ${time} !`,
        });

        if (onSuccess) {
          onSuccess(res.eventId, `${date} ${time}`);
        }
        onClose();
      } else {
        showToast({
          message: res.error || (isAr ? 'فشلت المزامنة مع تقويم جوجل' : 'Échec de la synchronisation avec Google Calendar'),
        });
      }
    } catch (err: any) {
      showToast({
        message: err?.message || 'Erreur lors de la programmation.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isAr
          ? '📅 تذكير عبر تقويم جوجل (منبه الهاتف)'
          : isEn
          ? '📅 Add Alarm via Google Calendar'
          : '📅 Programmer une alarme Google Calendar'
      }
      subtitle={
        isAr
          ? 'تنبيه مباشر على هاتفك في الوقت المحدد بالضبط'
          : isEn
          ? 'Native push alarm on your phone at the exact scheduled time'
          : 'Notification et alarme native sur votre smartphone'
      }
      maxWidth="md"
    >
      <form onSubmit={handleScheduleAlarm} className="space-y-4 pt-1">
        {/* Task Title Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              {isAr ? 'المهمة المحددة' : isEn ? 'Selected Task' : 'Tâche ciblée'}
            </span>
            <p className="text-sm font-extrabold text-zinc-900 dark:text-white truncate mt-0.5">
              {taskTitle}
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
            {isAr ? 'خيارات سريعة' : isEn ? 'Quick Presets' : 'Raccourcis rapides'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset(todayStr, '18:00')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                date === todayStr && time === '18:00'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {isAr ? 'اليوم 18:00' : isEn ? 'Today 18:00' : "Aujourd'hui 18h"}
            </button>
            <button
              type="button"
              onClick={() => applyPreset(todayStr, '20:00')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                date === todayStr && time === '20:00'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {isAr ? 'اليوم 20:00' : isEn ? 'Today 20:00' : "Aujourd'hui 20h"}
            </button>
            <button
              type="button"
              onClick={() => applyPreset(tomorrowStr, '09:00')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                date === tomorrowStr && time === '09:00'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {isAr ? 'غداً 09:00' : isEn ? 'Tomorrow 09:00' : 'Demain 09h'}
            </button>
            <button
              type="button"
              onClick={() => applyPreset(tomorrowStr, '10:00')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                date === tomorrowStr && time === '10:00'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {isAr ? 'غداً 10:00' : isEn ? 'Tomorrow 10:00' : 'Demain 10h'}
            </button>
          </div>
        </div>

        {/* Date and Time Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'تاريخ التنبيه' : isEn ? 'Alarm Date' : 'Date de l’alarme'} *</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'وقت التنبيه' : isEn ? 'Alarm Time' : 'Heure exacte'} *</span>
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Informative Guarantee Card */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            {isAr
              ? 'ملاحظة: سيتم ضبط منبه صوتي فوري (Popup at minute 0) عبر تقويم جوجل، ليرن هاتفك المحمول تلقائياً في الوقت المحدد.'
              : isEn
              ? 'Notice: A native popup reminder (minute 0) will be added to your Google Calendar to trigger an immediate phone alarm.'
              : 'Remarque : Un rappel immédiat (minutes: 0) sera configuré dans Google Calendar pour faire sonner votre smartphone à l’heure précise.'}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {isAr ? 'إلغاء' : isEn ? 'Cancel' : 'Annuler'}
          </Button>

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جاري الاتصال بـ Google...' : 'Connexion à Google...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد وتفعيل المنبه' : isEn ? 'Confirm & Set Alarm' : 'Activer l’alarme native'}</span>
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
