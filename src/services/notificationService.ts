/**
 * Flouss OS-Level Notification Service (PWA & Service Worker)
 * Handles:
 * 1. Immediate negative balance notifications
 * 2. Due bills & subscriptions reminders (1 day before + on due date at 09:00)
 * 3. Precision event warnings: 10-minute early warning & exact-time alerts
 * 4. In-app alarm bottom sheet trigger with audio alarm loop & haptics
 */

import { Language, TaskItem, SubscriptionItem, DebtItem, CalendarMeeting } from '../types';
import { formatMAD, getCurrentMonthStr, getTodayDateStr } from '../utils/formatters';
import { isIOS, isStandalonePWA, triggerAddToHomeScreenPrompt } from '../utils/device';

const NOTIFIED_CACHE_KEY = 'flouss_notified_events';

function getNotifiedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(NOTIFIED_CACHE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markNotified(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getNotifiedSet();
    set.add(key);
    sessionStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function isAlreadyNotified(key: string): boolean {
  return getNotifiedSet().has(key);
}

export interface InAppAlarmEventDetail {
  id: string;
  title: string;
  subtitle?: string;
  type: 'task' | 'bill' | 'meeting';
  scheduledTime?: string;
}

export function triggerInAppAlarm(detail: InAppAlarmEventDetail): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('flouss:in-app-alarm', { detail })
    );
  }
}

export class NotificationService {
  /**
   * Check if the Web Notification API is supported by the current browser/OS
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Current permission status
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request user permission for OS-level notifications.
   * On iOS: web push permission requires the app to be installed as a Home Screen PWA.
   * If invoked on iOS outside standalone mode, surfaces the Add to Home Screen guide.
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';

    if (isIOS() && !isStandalonePWA()) {
      triggerAddToHomeScreenPrompt();
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
          console.warn('SW registration failed in notification request:', e);
        }
      }
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Send an OS-level notification using Service Worker with fallback to Web Notification
   */
  static async showNotification(
    title: string,
    options: {
      body?: string;
      tag?: string;
      icon?: string;
      badge?: string;
      vibrate?: number[];
      data?: any;
    } = {}
  ): Promise<boolean> {
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      return false;
    }

    const notificationOptions: NotificationOptions = {
      body: options.body || '',
      icon: options.icon || '/icon-192.png',
      badge: options.badge || '/icon-192.png',
      tag: options.tag,
      data: options.data,
      // @ts-ignore: vibrate is supported in PWA mobile environments
      vibrate: options.vibrate || [200, 100, 200],
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notificationOptions);
          return true;
        }
      } catch (swErr) {
        // Fallback to desktop/browser notification below
      }
    }

    try {
      new Notification(title, notificationOptions);
      return true;
    } catch (err) {
      console.error('Failed to trigger Notification API:', err);
      return false;
    }
  }

  /**
   * Trigger 1: Negative Balance Alert
   */
  static checkNegativeBalance(
    currentBalance: number,
    previousBalance: number | null,
    language: Language
  ): void {
    if (currentBalance >= 0) return;
    if (previousBalance !== null && previousBalance < 0) return;

    const todayStr = getTodayDateStr();
    const dedupKey = `neg_balance_${todayStr}`;
    if (isAlreadyNotified(dedupKey)) return;
    markNotified(dedupKey);

    const titles: Record<Language, string> = {
      ar: 'تنبيه: رصيدك الحالي أصبح بالسالب!',
      fr: 'Attention : votre solde actuel est devenu négatif !',
      en: 'Alert: Your available balance is now negative!',
    };

    const bodies: Record<Language, string> = {
      ar: `رصيدك المتاح هو ${formatMAD(currentBalance, false, language)}. يرجى مراجعة نفقاتك وميزانيتك.`,
      fr: `Votre solde disponible est de ${formatMAD(currentBalance, false, language)}. Veuillez vérifier vos dépenses.`,
      en: `Your available balance is ${formatMAD(currentBalance, false, language)}. Please review your spending.`,
    };

    this.showNotification(titles[language] || titles.fr, {
      body: bodies[language] || bodies.fr,
      tag: 'negative-balance-alert',
    });
  }

  /**
   * Trigger 2: Due Bills & Invoices
   * Covers:
   * - 1 day before due date
   * - On due date (from 09:00 onwards)
   */
  static checkDueBills(
    subscriptions: SubscriptionItem[],
    debts: DebtItem[],
    language: Language
  ): void {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = getCurrentMonthStr();
    const todayStr = getTodayDateStr();
    const currentHours = today.getHours();

    // Check Subscriptions
    (subscriptions || []).forEach((sub) => {
      const isPaidThisMonth = (sub.paidMonths || []).includes(currentMonth);
      if (isPaidThisMonth) return;

      const billingDay = sub.billingDay;
      const daysBefore = sub.reminderDaysBefore ?? 1;

      // 1. One day before alert (or custom daysBefore)
      const daysUntilDue = billingDay - currentDay;
      if (daysUntilDue === daysBefore) {
        const dedupKey = `bill_sub_before_${sub.id}_${currentMonth}`;
        if (!isAlreadyNotified(dedupKey)) {
          markNotified(dedupKey);

          const titles: Record<Language, string> = {
            ar: `تذكير: فاتورة مستحقة قريباً (${sub.name})`,
            fr: `Rappel : facture à échéance demain (${sub.name})`,
            en: `Reminder: Bill due soon (${sub.name})`,
          };

          const bodies: Record<Language, string> = {
            ar: `فاتورة ${sub.name} بمبلغ ${formatMAD(sub.amount, false, language)} تستحق غداً.`,
            fr: `La charge ${sub.name} d'un montant de ${formatMAD(sub.amount, false, language)} arrive à échéance demain.`,
            en: `The bill for ${sub.name} (${formatMAD(sub.amount, false, language)}) is due tomorrow.`,
          };

          this.showNotification(titles[language] || titles.fr, {
            body: bodies[language] || bodies.fr,
            tag: `bill-before-${sub.id}`,
          });
        }
      }

      // 2. On due date alert (at or after 09:00)
      if (billingDay === currentDay && currentHours >= 9) {
        const dedupKey = `bill_sub_due_${sub.id}_${todayStr}`;
        if (!isAlreadyNotified(dedupKey)) {
          markNotified(dedupKey);

          const titles: Record<Language, string> = {
            ar: `تذكير فاتورة مستحقة اليوم: ${sub.name}`,
            fr: `Facture à régler aujourd'hui : ${sub.name}`,
            en: `Bill due today: ${sub.name}`,
          };

          const bodies: Record<Language, string> = {
            ar: `فاتورة ${sub.name} بمبلغ ${formatMAD(sub.amount, false, language)} مستحقة الأداء اليوم.`,
            fr: `La charge ${sub.name} d'un montant de ${formatMAD(sub.amount, false, language)} est à régler aujourd'hui.`,
            en: `The bill for ${sub.name} (${formatMAD(sub.amount, false, language)}) is scheduled for today.`,
          };

          this.showNotification(titles[language] || titles.fr, {
            body: bodies[language] || bodies.fr,
            tag: `bill-${sub.id}`,
          });

          // In-app alert if open
          triggerInAppAlarm({
            id: sub.id,
            title: sub.name,
            subtitle: formatMAD(sub.amount, false, language),
            type: 'bill',
          });
        }
      }
    });

    // Check Debts
    (debts || []).forEach((debt) => {
      if (debt.dueDate === todayStr && !debt.isSettled) {
        const dedupKey = `debt_${debt.id}_${todayStr}`;
        if (!isAlreadyNotified(dedupKey)) {
          markNotified(dedupKey);

          const isBorrow = debt.type === 'borrow';
          const remaining = Math.max(0, debt.totalAmount - (debt.paidAmount || 0));

          const titles: Record<Language, string> = {
            ar: isBorrow
              ? `تذكير سلفية مستحقة اليوم: ${debt.personName}`
              : `تذكير مستحقات اليوم: ${debt.personName}`,
            fr: isBorrow
              ? `Dette à rembourser aujourd'hui : ${debt.personName}`
              : `Remboursement attendu aujourd'hui : ${debt.personName}`,
            en: isBorrow
              ? `Debt to pay today: ${debt.personName}`
              : `Repayment expected today: ${debt.personName}`,
          };

          const bodies: Record<Language, string> = {
            ar: `المبلغ المتبقي: ${formatMAD(remaining, false, language)}.`,
            fr: `Montant restant : ${formatMAD(remaining, false, language)}.`,
            en: `Remaining amount: ${formatMAD(remaining, false, language)}.`,
          };

          this.showNotification(titles[language] || titles.fr, {
            body: bodies[language] || bodies.fr,
            tag: `debt-${debt.id}`,
          });
        }
      }
    });
  }

  /**
   * Trigger 3: Precision Event Reminders (Tasks & Meetings)
   * 1. 10-minute early warning
   * 2. Exact-time alert (triggers full-screen in-app alarm with sound & haptics)
   */
  static checkUpcomingEventReminders(
    tasks: TaskItem[],
    meetings: CalendarMeeting[] = [],
    language: Language
  ): void {
    const now = new Date();
    const todayStr = getTodayDateStr();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check Tasks
    (tasks || []).forEach((task) => {
      if (task.isArchived) return;
      const isCompletedToday = (task.completedDates || []).includes(todayStr);
      if (isCompletedToday) return;

      let scheduledDate = task.scheduledDate;
      let scheduledTime = task.scheduledTime;

      if (!scheduledDate && task.scheduledDateTime) {
        const parts = task.scheduledDateTime.split('T');
        scheduledDate = parts[0];
        if (parts[1] && !scheduledTime) {
          scheduledTime = parts[1].slice(0, 5);
        }
      }

      if (scheduledDate === todayStr && scheduledTime) {
        const timeParts = scheduledTime.split(':');
        if (timeParts.length >= 2) {
          const taskHours = parseInt(timeParts[0], 10);
          const taskMins = parseInt(timeParts[1], 10);
          if (!isNaN(taskHours) && !isNaN(taskMins)) {
            const taskTotalMinutes = taskHours * 60 + taskMins;
            const diffMinutes = taskTotalMinutes - currentMinutes;

            // 1. 10-minute early warning
            if (diffMinutes >= 9 && diffMinutes <= 11) {
              const dedupKey = `task_10m_${task.id}_${todayStr}`;
              if (!isAlreadyNotified(dedupKey)) {
                markNotified(dedupKey);

                const titles: Record<Language, string> = {
                  ar: 'تذكير: لديك موعد بعد 10 دقائق',
                  fr: 'Rappel : vous avez un rendez-vous dans 10 minutes',
                  en: 'Reminder: You have an appointment in 10 minutes',
                };

                const bodies: Record<Language, string> = {
                  ar: `${task.title} (على الساعة ${scheduledTime})`,
                  fr: `${task.title} (prévu à ${scheduledTime})`,
                  en: `${task.title} (scheduled at ${scheduledTime})`,
                };

                this.showNotification(titles[language] || titles.fr, {
                  body: bodies[language] || bodies.fr,
                  tag: `task-10m-${task.id}`,
                });
              }
            }

            // 2. Exact-time alert: diff 0 to 1 minutes
            if (diffMinutes >= 0 && diffMinutes <= 1) {
              const dedupKey = `task_exact_${task.id}_${todayStr}`;
              if (!isAlreadyNotified(dedupKey)) {
                markNotified(dedupKey);

                const titles: Record<Language, string> = {
                  ar: 'حان الآن وقت موعدك',
                  fr: "C'est l'heure de votre rendez-vous",
                  en: 'It is time for your appointment',
                };

                this.showNotification(titles[language] || titles.fr, {
                  body: task.title,
                  tag: `task-exact-${task.id}`,
                });

                // Trigger in-app high priority alarm bottom sheet
                triggerInAppAlarm({
                  id: task.id,
                  title: task.title,
                  scheduledTime,
                  type: 'task',
                });
              }
            }
          }
        }
      }
    });

    // Check Meetings
    (meetings || []).forEach((meeting) => {
      if (meeting.date === todayStr && meeting.time) {
        const [mHours, mMins] = meeting.time.split(':').map((n) => parseInt(n, 10));
        if (!isNaN(mHours) && !isNaN(mMins)) {
          const meetingMinutes = mHours * 60 + mMins;
          const diffMinutes = meetingMinutes - currentMinutes;

          // 10-minute warning
          if (diffMinutes >= 9 && diffMinutes <= 11) {
            const dedupKey = `meeting_10m_${meeting.id}_${todayStr}`;
            if (!isAlreadyNotified(dedupKey)) {
              markNotified(dedupKey);
              this.showNotification(
                language === 'ar' ? `تذكير باجتماع: ${meeting.title}` : `Rappel réunion : ${meeting.title}`,
                {
                  body: `${meeting.time} (${meeting.durationMinutes} min)`,
                  tag: `meeting-10m-${meeting.id}`,
                }
              );
            }
          }

          // Exact time
          if (diffMinutes >= 0 && diffMinutes <= 1) {
            const dedupKey = `meeting_exact_${meeting.id}_${todayStr}`;
            if (!isAlreadyNotified(dedupKey)) {
              markNotified(dedupKey);
              this.showNotification(
                language === 'ar' ? 'بدأ الاجتماع الآن' : "La réunion commence maintenant",
                {
                  body: meeting.title,
                  tag: `meeting-exact-${meeting.id}`,
                }
              );

              triggerInAppAlarm({
                id: meeting.id,
                title: meeting.title,
                scheduledTime: meeting.time,
                type: 'meeting',
              });
            }
          }
        }
      }
    });
  }

  /**
   * Start background evaluation scheduler (runs every 30 seconds while app is active)
   */
  static startScheduler(getState: () => any): () => void {
    const runCheck = () => {
      try {
        const state = getState();
        if (!state) return;
        const { subscriptions, debts, tasks, meetings, language } = state;
        this.checkDueBills(subscriptions || [], debts || [], language || 'fr');
        this.checkUpcomingEventReminders(tasks || [], meetings || [], language || 'fr');
      } catch (err) {
        console.warn('Error during notification scheduler check:', err);
      }
    };

    const initialTimer = setTimeout(runCheck, 2000);
    const intervalTimer = setInterval(runCheck, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }
}
