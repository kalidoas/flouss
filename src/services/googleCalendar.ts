import { GoogleAuthProvider, signInWithPopup } from '@firebase/auth';
import { auth } from '../lib/firebase';
import { useAppStore } from '../store/useAppStore';

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const TOKEN_STORAGE_KEY = 'flouss_google_access_token';
const SCOPE_STORAGE_KEY = 'flouss_google_calendar_scope_granted';
const USER_EMAIL_KEY = 'flouss_google_calendar_email';

export interface CalendarEventReminderOverride {
  method: 'popup';
  minutes: number;
}

/**
 * Event emitter for Google Calendar authentication requirement (reconnect bottom sheet)
 */
export function triggerCalendarReconnectModal(reason = 'expired'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('flouss:google-calendar-reconnect', { detail: { reason } })
    );
  }
}

const TOKEN_EXPIRY_KEY = 'flouss_google_access_token_expiry';

export function isGoogleAccessTokenExpired(): boolean {
  try {
    const rawExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!rawExpiry) return false;
    return Date.now() >= Number(rawExpiry);
  } catch {
    return false;
  }
}

/**
 * Get stored Google OAuth access token or return null (auto-clears if expired)
 */
export function getStoredGoogleAccessToken(): string | null {
  try {
    if (isGoogleAccessTokenExpired()) {
      setStoredGoogleAccessToken(null, false, null);
      return null;
    }
    return (
      sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
      null
    );
  } catch (e) {
    return null;
  }
}

/**
 * Get stored Google account email associated with calendar sync
 */
export function getStoredGoogleCalendarEmail(): string | null {
  try {
    return (
      sessionStorage.getItem(USER_EMAIL_KEY) ||
      localStorage.getItem(USER_EMAIL_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Save or clear Google OAuth access token, scope flag, and email
 */
export function setStoredGoogleAccessToken(
  token: string | null,
  hasCalendarScope = false,
  email?: string | null
): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      // Google access tokens expire after 3600 seconds; set 3500s safety margin
      const expiry = String(Date.now() + 3500 * 1000);
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiry);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiry);
      if (hasCalendarScope) {
        sessionStorage.setItem(SCOPE_STORAGE_KEY, 'true');
        localStorage.setItem(SCOPE_STORAGE_KEY, 'true');
      }
      if (email) {
        sessionStorage.setItem(USER_EMAIL_KEY, email);
        localStorage.setItem(USER_EMAIL_KEY, email);
      }
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      sessionStorage.removeItem(SCOPE_STORAGE_KEY);
      localStorage.removeItem(SCOPE_STORAGE_KEY);
      sessionStorage.removeItem(USER_EMAIL_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
    }
  } catch (e) {
    // Ignore storage errors in private mode
  }
}

/**
 * Disconnect Google Calendar completely from local state
 */
export function disconnectGoogleCalendar(): void {
  setStoredGoogleAccessToken(null, false, null);
  const store = useAppStore.getState();
  if (store.updateNotificationSettings) {
    store.updateNotificationSettings({
      googleCalendarConnected: false,
      googleCalendarEmail: null,
    });
  }
}

/**
 * Validates whether an OAuth token is active and has the required Calendar scope
 * via Google's tokeninfo endpoint.
 */
export async function checkHasCalendarScope(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(token)}`
    );
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    const scopeStr: string = data?.scope || '';
    const hasScope =
      scopeStr.includes('https://www.googleapis.com/auth/calendar.events') ||
      scopeStr.includes('https://www.googleapis.com/auth/calendar');

    if (data?.email) {
      try {
        sessionStorage.setItem(USER_EMAIL_KEY, data.email);
        localStorage.setItem(USER_EMAIL_KEY, data.email);
      } catch {}
    }

    return hasScope;
  } catch (err) {
    try {
      return localStorage.getItem(SCOPE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}

/**
 * Triggers an incremental OAuth consent popup specifically requesting the Calendar scope.
 */
export async function requestGoogleCalendarAuth(forceConsent = true): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_SCOPE);

  provider.setCustomParameters({
    prompt: forceConsent ? 'consent select_account' : 'select_account',
    access_type: 'offline',
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  const email = result.user?.email || null;

  if (!accessToken) {
    throw new Error('Impossible de récupérer le jeton d’accès Google.');
  }

  setStoredGoogleAccessToken(accessToken, true, email);

  // Update store notification settings
  const store = useAppStore.getState();
  if (store.updateNotificationSettings) {
    store.updateNotificationSettings({
      googleCalendarConnected: true,
      googleCalendarEmail: email,
    });
  }

  return accessToken;
}

/**
 * Formats a local Date object into RFC 3339 / ISO 8601 with exact local timezone offset (+HH:MM / -HH:MM)
 */
export function formatRFC3339WithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}

/**
 * Build recurring monthly RRULE for bills/subscriptions.
 * For days 29–31, uses BYMONTHDAY=28,29,30,31;BYSETPOS=-1 so short months (February, April, etc.)
 * are never skipped and trigger on the last valid day of that month.
 */
export function buildMonthlyBillRRule(billingDay: number): string {
  const day = Math.min(Math.max(Math.round(billingDay || 1), 1), 31);
  if (day >= 29) {
    return 'RRULE:FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1';
  }
  return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`;
}

/**
 * Map reminder lead times in minutes to Google Calendar popup overrides.
 * Strictly caps at maximum 5 overrides (Google Calendar API limit).
 */
export function computeReminderOverrides(
  leadMinutes: number[]
): CalendarEventReminderOverride[] {
  if (!Array.isArray(leadMinutes) || leadMinutes.length === 0) {
    return [{ method: 'popup', minutes: 0 }];
  }

  const validSet = new Set<number>();
  leadMinutes.forEach((m) => {
    const parsed = Math.round(Number(m));
    if (!isNaN(parsed) && parsed >= 0) {
      validSet.add(parsed);
    }
  });

  if (validSet.size === 0) {
    return [{ method: 'popup', minutes: 0 }];
  }

  // Sort descending and cap to maximum 5 items
  const sorted = Array.from(validSet).sort((a, b) => b - a);
  const capped = sorted.slice(0, 5);

  return capped.map((minutes) => ({
    method: 'popup',
    minutes,
  }));
}

export interface SyncEntityCalendarOptions {
  floussId: string;
  title: string;
  description?: string;
  startDateTime: string; // RFC 3339
  endDateTime: string; // RFC 3339
  entityType: 'task' | 'bill' | 'meeting';
  remindersMinutes?: number[];
  rrule?: string;
  attendees?: string[];
  sendUpdates?: 'all' | 'none';
}

export interface GoogleCalendarEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
  requiresReconnect?: boolean;
}

/**
 * Single idempotent sync function keyed by extendedProperties.private.flouss_id.
 * Queries events.list?privateExtendedProperty=flouss_id=<id> first:
 * - If event exists -> updates via PUT/PATCH
 * - If not -> inserts via POST
 */
export async function syncEntityToGoogleCalendar(
  opts: SyncEntityCalendarOptions
): Promise<GoogleCalendarEventResult> {
  const lang = useAppStore.getState().language || 'ar';
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  let token = getStoredGoogleAccessToken();
  let hasScope = false;

  if (token) {
    hasScope = await checkHasCalendarScope(token);
  }

  if (!token || !hasScope) {
    try {
      token = await requestGoogleCalendarAuth(true);
      hasScope = true;
    } catch (authErr: any) {
      triggerCalendarReconnectModal('auth_needed');
      return {
        success: false,
        requiresReconnect: true,
        error: isAr
          ? 'يلزم تفويض تقويم جوجل لجدولة المنبه.'
          : isEn
          ? 'Google Calendar authorization required.'
          : 'Autorisation Google Calendar requise.',
      };
    }
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Casablanca';
  const overrides = computeReminderOverrides(opts.remindersMinutes || [0]);

  const payload: any = {
    summary: opts.title,
    description: opts.description || `Flouss ${opts.entityType} (Alarme native)`,
    start: {
      dateTime: opts.startDateTime,
      timeZone,
    },
    end: {
      dateTime: opts.endDateTime,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides,
    },
    extendedProperties: {
      private: {
        flouss_id: opts.floussId,
        flouss_type: opts.entityType,
      },
    },
  };

  if (opts.rrule) {
    payload.recurrence = [opts.rrule];
  }

  if (Array.isArray(opts.attendees) && opts.attendees.length > 0) {
    payload.attendees = opts.attendees
      .filter((email) => email && email.includes('@'))
      .map((email) => ({ email: email.trim() }));
  }

  const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=flouss_id=${encodeURIComponent(
    opts.floussId
  )}`;

  const sendQuery = opts.sendUpdates ? `?sendUpdates=${opts.sendUpdates}` : '';

  try {
    let listRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (listRes.status === 401 || listRes.status === 403) {
      setStoredGoogleAccessToken(null);
      triggerCalendarReconnectModal('expired');
      return {
        success: false,
        requiresReconnect: true,
        error: isAr
          ? 'انتهت صلاحية جلسة تقويم جوجل. يرجى إعادة الاتصال.'
          : isEn
          ? 'Google Calendar session expired. Please reconnect.'
          : 'Session Google Calendar expirée. Veuillez vous reconnecter.',
      };
    }

    const listData = await listRes.json().catch(() => ({ items: [] }));
    const existingEvents: any[] = listData?.items || [];
    const activeExisting = existingEvents.find((ev) => ev.status !== 'cancelled');

    let saveRes: Response;
    if (activeExisting) {
      const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${activeExisting.id}${sendQuery}`;
      saveRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } else {
      const insertUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events${sendQuery}`;
      saveRes = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

    if (!saveRes.ok) {
      if (saveRes.status === 401 || saveRes.status === 403) {
        setStoredGoogleAccessToken(null);
        triggerCalendarReconnectModal('expired');
        return {
          success: false,
          requiresReconnect: true,
          error: isAr
            ? 'انتهت صلاحية الجلسة. يرجى إعادة الاتصال.'
            : isEn
            ? 'Session expired. Please reconnect.'
            : 'Session expirée. Veuillez vous reconnecter.',
        };
      }

      const errData = await saveRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData?.error?.message || `Erreur Google Calendar (${saveRes.status})`,
      };
    }

    const savedData = await saveRes.json();
    return {
      success: true,
      eventId: savedData.id,
      htmlLink: savedData.htmlLink,
    };
  } catch (netErr: any) {
    return {
      success: false,
      error: netErr?.message || 'Erreur réseau avec Google Calendar.',
    };
  }
}

/**
 * Delete a Google Calendar event associated with a Flouss ID
 */
export async function deleteCalendarEventByFloussId(floussId: string): Promise<boolean> {
  const token = getStoredGoogleAccessToken();
  if (!token || !floussId) return false;

  const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=flouss_id=${encodeURIComponent(
    floussId
  )}`;

  try {
    const listRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok) return false;

    const data = await listRes.json().catch(() => ({ items: [] }));
    const events: any[] = data?.items || [];

    for (const ev of events) {
      if (ev.id) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${ev.id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(() => {});
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Handle bill paid for a specific month instance (e.g. "2026-11").
 * Marking a bill paid must NOT delete the recurring series.
 * Queries recurring instances for that month and strips reminders / cancels that specific instance.
 */
export async function handleBillPaidCalendarInstance(
  billId: string,
  yearMonth: string // YYYY-MM
): Promise<boolean> {
  const token = getStoredGoogleAccessToken();
  if (!token || !billId || !yearMonth) return false;

  const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=flouss_id=${encodeURIComponent(
    billId
  )}`;

  try {
    const listRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok) return false;

    const listData = await listRes.json().catch(() => ({ items: [] }));
    const recurringEvent = (listData?.items || []).find((ev: any) => ev.recurrence);
    if (!recurringEvent || !recurringEvent.id) return false;

    // Time window for this specific month
    const [year, month] = yearMonth.split('-').map((n) => parseInt(n, 10));
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();

    const instancesUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${
      recurringEvent.id
    }/instances?timeMin=${encodeURIComponent(startOfMonth)}&timeMax=${encodeURIComponent(
      endOfMonth
    )}`;

    const instancesRes = await fetch(instancesUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!instancesRes.ok) return false;

    const instancesData = await instancesRes.json();
    const instances: any[] = instancesData?.items || [];
    if (instances.length === 0) return false;

    // Modify the single instance: remove reminder overrides and update status to preserve the series
    for (const inst of instances) {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${inst.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reminders: {
              useDefault: false,
              overrides: [],
            },
            status: 'cancelled',
          }),
        }
      ).catch(() => {});
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * List upcoming calendar events for today / next 7 days
 */
export async function listUpcomingCalendarEvents(
  days = 7
): Promise<{ events: any[]; error?: string; requiresReconnect?: boolean }> {
  const token = getStoredGoogleAccessToken();
  if (!token) {
    return { events: [], requiresReconnect: false };
  }

  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const timeMin = now.toISOString();
  const timeMax = future.toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      setStoredGoogleAccessToken(null);
      triggerCalendarReconnectModal('expired');
      return { events: [], requiresReconnect: true, error: 'Session expired' };
    }

    if (!res.ok) {
      return { events: [], error: `Calendar API error (${res.status})` };
    }

    const data = await res.json();
    return { events: data?.items || [], requiresReconnect: false };
  } catch (err: any) {
    return { events: [], error: err?.message || 'Network error' };
  }
}

/**
 * Backwards-compatible createGoogleCalendarEvent wrapper
 */
export async function createGoogleCalendarEvent(input: {
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime?: string;
  durationMinutes?: number;
  floussId?: string;
  remindersMinutes?: number[];
}): Promise<GoogleCalendarEventResult> {
  const time = input.scheduledTime && input.scheduledTime.includes(':') ? input.scheduledTime : '10:00';
  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  const [year, month, day] = input.scheduledDate.split('-').map((n) => parseInt(n, 10));

  const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const durationMs = (input.durationMinutes || 30) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);

  const id = input.floussId || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return syncEntityToGoogleCalendar({
    floussId: id,
    title: input.title,
    description: input.description,
    startDateTime: formatRFC3339WithOffset(startDate),
    endDateTime: formatRFC3339WithOffset(endDate),
    entityType: 'task',
    remindersMinutes: input.remindersMinutes || [10, 0],
  });
}
