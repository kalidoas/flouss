import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAppStore } from '../../store/useAppStore';
import { formatRFC3339WithOffset, syncEntityToGoogleCalendar } from '../../services/googleCalendar';
import { CalendarMeeting } from '../../types';
import { Calendar, Clock, Mail, Users, Bell, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language, addMeeting, showToast } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [attendeesInput, setAttendeesInput] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    setLoading(true);

    const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
    const [year, month, day] = date.split('-').map((n) => parseInt(n, 10));
    const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const attendeeEmails = attendeesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s.includes('@'));

    const parsedLead = parseInt(reminderMinutes, 10) || 10;
    const remindersMinutes = [parsedLead, 0];
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    try {
      const res = await syncEntityToGoogleCalendar({
        floussId: meetingId,
        title: title.trim(),
        description: description.trim() || undefined,
        startDateTime: formatRFC3339WithOffset(startDate),
        endDateTime: formatRFC3339WithOffset(endDate),
        entityType: 'meeting',
        attendees: attendeeEmails,
        sendUpdates: 'all',
        remindersMinutes,
      });

      const newMeeting: CalendarMeeting = {
        id: meetingId,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time,
        durationMinutes,
        attendees: attendeeEmails,
        remindersMinutes,
        googleCalendarEventId: res.eventId,
        htmlLink: res.htmlLink,
        createdAt: new Date().toISOString(),
      };

      addMeeting(newMeeting);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast({
        message: isAr
          ? '✓ تم جدولة الاجتماع وإرسال الدعوات عبر Google Calendar!'
          : isEn
          ? '✓ Meeting scheduled and invitations sent via Google Calendar!'
          : '✓ Réunion planifiée et invitations envoyées avec Google Calendar !',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        message: err?.message || 'Erreur lors de la création de la réunion',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAr ? '📅 جدولة اجتماع جديد' : isEn ? '📅 New Meeting' : '📅 Planifier une réunion'}
      subtitle={
        isAr
          ? 'مزامنة مع تقويم جوجل وإرسال دعوات الحضور للمشاركين'
          : isEn
          ? 'Sync to Google Calendar with automatic email attendee invitations'
          : 'Synchronisation Google Calendar et invitations par email'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            {isAr ? 'عنوان الاجتماع' : isEn ? 'Meeting Title' : 'Titre de la réunion'} *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isAr
                ? 'مثال: جلسة عمل مع العميل، مراجعة المشروع...'
                : isEn
                ? 'e.g., Client sync, project sprint review...'
                : 'Ex : Point projet, réunion client...'
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'التاريخ' : isEn ? 'Date' : 'Date'} *</span>
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
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'الوقت' : isEn ? 'Time' : 'Heure'} *</span>
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

        {/* Duration & Reminder lead */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {isAr ? 'المدة' : isEn ? 'Duration' : 'Durée'}
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 heure (60 min)</option>
              <option value={90}>1h 30 min</option>
              <option value={120}>2 heures</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'تنبيه مبكر' : isEn ? 'Early Reminder' : 'Rappel anticipé'}</span>
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">{isAr ? 'قبل 5 دقائق' : isEn ? '5 min before' : '5 min avant'}</option>
              <option value="10">{isAr ? 'قبل 10 دقائق' : isEn ? '10 min before' : '10 min avant'}</option>
              <option value="15">{isAr ? 'قبل 15 دقيقة' : isEn ? '15 min before' : '15 min avant'}</option>
              <option value="30">{isAr ? 'قبل 30 دقيقة' : isEn ? '30 min before' : '30 min avant'}</option>
              <option value="60">{isAr ? 'قبل ساعة' : isEn ? '1 hour before' : '1 heure avant'}</option>
            </select>
          </div>
        </div>

        {/* Attendees Emails */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {isAr
                ? 'البريد الإلكتروني للمشاركين (مفصول بفاصلة)'
                : isEn
                ? 'Attendee Emails (comma separated)'
                : 'Invités (emails séparés par virgule)'}
            </span>
          </label>
          <input
            type="text"
            value={attendeesInput}
            onChange={(e) => setAttendeesInput(e.target.value)}
            placeholder="colleague@example.com, client@work.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notice */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-800 dark:text-blue-200 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <span>
            {isAr
              ? 'سيتم إرسال دعوات الحضور تلقائياً إلى بريد جميع المشاركين عبر خوادم Google Calendar (sendUpdates=all).'
              : isEn
              ? 'Invitations will automatically be emailed to all attendees via Google Calendar (sendUpdates=all).'
              : 'Les invitations seront automatiquement envoyées par email aux participants via Google Calendar.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {isAr ? 'إلغاء' : isEn ? 'Cancel' : 'Annuler'}
          </Button>

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جاري الجدولة...' : 'Planification...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'حفظ وجدولة الاجتماع' : isEn ? 'Schedule Meeting' : 'Planifier la réunion'}</span>
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
