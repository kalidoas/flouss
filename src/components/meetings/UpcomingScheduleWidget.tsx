import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { listUpcomingCalendarEvents, getStoredGoogleAccessToken } from '../../services/googleCalendar';
import { NewMeetingModal } from './NewMeetingModal';
import { Calendar, Clock, Plus, RefreshCw, AlertCircle, ExternalLink, Users } from 'lucide-react';
import { playHapticFeedback } from '../../utils/haptics';
import { translations } from '../../i18n/translations';

export const UpcomingScheduleWidget: React.FC = () => {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const tCommon = translations[language].common;

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);

  const fetchSchedule = async () => {
    const token = getStoredGoogleAccessToken();
    if (!token) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await listUpcomingCalendarEvents(7);
      if (res.error) {
        setError(res.error);
      } else {
        setEvents(res.events || []);
      }
    } catch (err: any) {
      setError(err?.message || tCommon.calendarError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const formatEventTime = (ev: any) => {
    const raw = ev?.start?.dateTime || ev?.start?.date;
    if (!raw) return '';
    try {
      const d = new Date(raw);
      const dayStr = d.toLocaleDateString(
        isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR',
        { weekday: 'short', day: 'numeric', month: 'short' }
      );
      if (ev?.start?.dateTime) {
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dayStr} • ${timeStr}`;
      }
      return dayStr;
    } catch {
      return raw;
    }
  };

  const token = getStoredGoogleAccessToken();

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              {tCommon.upcomingSchedule}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {tCommon.syncedWithCalendar}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              playHapticFeedback('selection');
              fetchSchedule();
            }}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={tCommon.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              playHapticFeedback('selection');
              setIsNewMeetingOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tCommon.newMeeting}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {!token ? (
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/40 text-center space-y-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isAr
              ? 'قم بربط حساب Google Calendar لعرض جدول مواعيدك واجتماعاتك هنا مباشرة.'
              : isEn
              ? 'Connect Google Calendar in Settings to view your schedule and meetings here.'
              : 'Connectez Google Calendar pour afficher votre agenda et réunions ici.'}
          </p>
        </div>
      ) : loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>{tCommon.loadingSchedule}</span>
        </div>
      ) : error ? (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-400">
          {isAr
            ? 'لا توجد مواعيد أو اجتماعات مبرمجة في الأيام الـ 7 القادمة 👍'
            : isEn
            ? 'No upcoming meetings or events scheduled for the next 7 days 👍'
            : 'Aucun événement prévu pour les 7 prochains jours 👍'}
        </div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 5).map((ev) => (
            <div
              key={ev.id}
              className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-bold text-zinc-900 dark:text-white truncate">
                  {ev.summary || tCommon.untitledEvent}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>{formatEventTime(ev)}</span>
                  {ev.attendees && ev.attendees.length > 0 && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Users className="w-3 h-3" />
                      <span>{ev.attendees.length}</span>
                    </span>
                  )}
                </div>
              </div>

              {ev.htmlLink && (
                <a
                  href={ev.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
                  title="Ouvrir dans Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Meeting Modal */}
      <NewMeetingModal
        isOpen={isNewMeetingOpen}
        onClose={() => setIsNewMeetingOpen(false)}
        onSuccess={fetchSchedule}
      />
    </div>
  );
};
