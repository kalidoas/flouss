import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const TOKEN_STORAGE_KEY = 'flouss_google_access_token';

/**
 * Get stored Google OAuth access token or return null
 */
export function getStoredGoogleAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch (e) {
    return null;
  }
}

/**
 * Save Google OAuth access token
 */
export function setStoredGoogleAccessToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    // Ignore storage errors in private mode
  }
}

/**
 * Request or refresh Google OAuth token with Calendar events scope
 */
export async function requestGoogleCalendarAuth(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (!accessToken) {
    throw new Error('Impossible de récupérer le jeton d’accès Google.');
  }

  setStoredGoogleAccessToken(accessToken);
  return accessToken;
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
 * Creates an event on the user's primary Google Calendar with an immediate popup alarm reminder
 */
export async function createGoogleCalendarEvent(
  input: GoogleCalendarEventInput
): Promise<GoogleCalendarEventResult> {
  let token = getStoredGoogleAccessToken();

  // If token is missing, request auth popup from user
  if (!token) {
    try {
      token = await requestGoogleCalendarAuth();
    } catch (authErr: any) {
      return {
        success: false,
        error: authErr?.message || 'Autorisation Google requise.',
      };
    }
  }

  // Parse Date and Time
  const time = input.scheduledTime && input.scheduledTime.includes(':')
    ? input.scheduledTime
    : '09:00';

  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  const [year, month, day] = input.scheduledDate.split('-').map((n) => parseInt(n, 10));

  const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (isNaN(startDate.getTime())) {
    return {
      success: false,
      error: 'Date ou heure invalide.',
    };
  }

  const durationMs = (input.durationMinutes || 30) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const payload = {
    summary: input.title,
    description: input.description || 'Tâche programmée depuis Flouss',
    start: {
      dateTime: startDate.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone,
    },
    // CRUCIAL: Native push notification / alarm popup at exact scheduled time (0 minutes before)
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

    // If token expired (401 Unauthorized), prompt once for refresh
    if (response.status === 401) {
      setStoredGoogleAccessToken(null);
      token = await requestGoogleCalendarAuth();
      response = await makeApiCall(token);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `Erreur Google Calendar (${response.status})`;
      return {
        success: false,
        error: errMsg,
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
      error: err?.message || 'Erreur réseau lors de la communication avec Google Calendar.',
    };
  }
}
