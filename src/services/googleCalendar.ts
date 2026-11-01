import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAppStore } from '../store/useAppStore';

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const TOKEN_STORAGE_KEY = 'flouss_google_access_token';
const SCOPE_STORAGE_KEY = 'flouss_google_calendar_scope_granted';

/**
 * Get stored Google OAuth access token or return null
 */
export function getStoredGoogleAccessToken(): string | null {
  try {
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
 * Save or clear Google OAuth access token and calendar scope flag
 */
export function setStoredGoogleAccessToken(token: string | null, hasCalendarScope = false): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (hasCalendarScope) {
        sessionStorage.setItem(SCOPE_STORAGE_KEY, 'true');
        localStorage.setItem(SCOPE_STORAGE_KEY, 'true');
      }
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(SCOPE_STORAGE_KEY);
      localStorage.removeItem(SCOPE_STORAGE_KEY);
    }
  } catch (e) {
    // Ignore storage errors in private mode
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
 * Uses prompt: 'consent select_account' so Google explicitly displays the permission grant screen.
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

  if (!accessToken) {
    throw new Error('Impossible de récupérer le jeton d’accès Google.');
  }

  setStoredGoogleAccessToken(accessToken, true);
  return accessToken;
}

/**
 * Formats a local Date object into RFC 3339 / ISO 8601 with exact local timezone offset (+HH:MM / -HH:MM)
 * Guarantees Google Calendar places the event at local time (e.g., Moroccan time UTC+1) without UTC drift.
 */
export function formatRFC3339WithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // getTimezoneOffset() returns minutes difference between UTC and local time
  // For UTC+1 (e.g. Morocco), getTimezoneOffset() is -60 minutes.
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}

function getFriendlyAuthError(err: any): string {
  const lang = useAppStore.getState().language || 'ar';
  const isAr = lang === 'ar';
  const isEn = lang === 'en';
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code.includes('popup-closed') || msg.toLowerCase().includes('closed by user')) {
    return isAr
      ? 'تم إغلاق نافذة التفويض قبل منح الإذن. يرجى الضغط على "السماح" لجدولة منبه الهاتف.'
      : isEn
      ? 'Authorization window was closed. Please click "Allow" to schedule phone alarms.'
      : 'La fenêtre d’autorisation a été fermée. Veuillez cliquer sur "Autoriser" pour planifier l’alarme.';
  }

  if (code.includes('popup-blocked')) {
    return isAr
      ? 'المتصفح حظر النافذة المنبثقة. يرجى تفعيل النوافذ المنبثقة (Popups) وإعادة المحاولة.'
      : isEn
      ? 'Pop-up blocked by your browser. Please allow pop-ups for this site and retry.'
      : 'Le pop-up a été bloqué par votre navigateur. Veuillez autoriser les fenêtres pop-up.';
  }

  return isAr
    ? 'تعذر الحصول على إذن تقويم جوجل. يرجى المحاولة مجدداً.'
    : isEn
    ? 'Failed to obtain Google Calendar authorization. Please try again.'
    : 'Échec de l’autorisation Google Calendar. Veuillez réessayer.';
}

export interface GoogleCalendarEventInput {
  title: string;
  description?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm (e.g. "10:00")
  durationMinutes?: number; // Default 30 min
}

export interface GoogleCalendarEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
}

/**
 * Creates an event on the user's primary Google Calendar with an immediate popup alarm reminder.
 * Implements incremental authorization: verifies and requests calendar.events scope before API call,
 * with automatic fallback and retry on 401/403.
 */
export async function createGoogleCalendarEvent(
  input: GoogleCalendarEventInput
): Promise<GoogleCalendarEventResult> {
  const lang = useAppStore.getState().language || 'ar';
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  let token = getStoredGoogleAccessToken();
  let hasScope = false;

  // 1. Incremental Authorization Check: Verify if token exists AND has the Calendar scope
  if (token) {
    hasScope = await checkHasCalendarScope(token);
  }

  // 2. If token is missing or lacks the Calendar scope, prompt user with OAuth consent popup
  if (!token || !hasScope) {
    try {
      token = await requestGoogleCalendarAuth(true);
      hasScope = true;
    } catch (authErr: any) {
      return {
        success: false,
        error: getFriendlyAuthError(authErr),
      };
    }
  }

  // 3. Timezone Handling: Parse Date and Time and format with exact local timezone offset (Moroccan time)
  const time = input.scheduledTime && input.scheduledTime.includes(':')
    ? input.scheduledTime
    : '10:00';

  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  const [year, month, day] = input.scheduledDate.split('-').map((n) => parseInt(n, 10));

  const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (isNaN(startDate.getTime())) {
    return {
      success: false,
      error: isAr ? 'التاريخ أو الوقت غير صالح.' : isEn ? 'Invalid date or time.' : 'Date ou heure invalide.',
    };
  }

  const durationMs = (input.durationMinutes || 30) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Casablanca';

  const startDateTime = formatRFC3339WithOffset(startDate);
  const endDateTime = formatRFC3339WithOffset(endDate);

  // 4. Force Native Mobile Alarm Notification via minute 0 popup reminder override
  const payload = {
    summary: input.title,
    description: input.description || 'Tâche programmée depuis Flouss (Alarme native)',
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        {
          method: 'popup',
          minutes: 0,
        },
      ],
    },
  };

  const makeApiCall = async (authToken: string) => {
    return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  };

  try {
    let response = await makeApiCall(token);

    // 5. Automatic Refresh on 401 (Unauthorized) or 403 (Forbidden / Scope Insufficient)
    if (response.status === 401 || response.status === 403) {
      setStoredGoogleAccessToken(null);
      try {
        token = await requestGoogleCalendarAuth(true);
        response = await makeApiCall(token);
      } catch (refreshErr: any) {
        return {
          success: false,
          error: getFriendlyAuthError(refreshErr),
        };
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const rawErrMsg = errData?.error?.message || '';

      if (
        rawErrMsg.toLowerCase().includes('insufficient') ||
        rawErrMsg.toLowerCase().includes('propagate') ||
        rawErrMsg.toLowerCase().includes('scope')
      ) {
        setStoredGoogleAccessToken(null);
        return {
          success: false,
          error: isAr
            ? 'يرجى منح الإذن لتطبيق Flouss للوصول إلى تقويم جوجل لتفعيل المنبه الصوتي على هاتفك.'
            : isEn
            ? 'Please grant Flouss permission to access Google Calendar to enable phone alarms.'
            : 'Veuillez autoriser l’accès à Google Calendar pour activer les alarmes natives sur votre téléphone.',
        };
      }

      return {
        success: false,
        error: rawErrMsg || `Erreur Google Calendar (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        (isAr
          ? 'حدث خطأ في الاتصال بتقويم جوجل.'
          : isEn
          ? 'Network error while contacting Google Calendar.'
          : 'Erreur réseau lors de la communication avec Google Calendar.'),
    };
  }
}
