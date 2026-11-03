/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildMonthlyBillRRule,
  computeReminderOverrides,
  syncEntityToGoogleCalendar,
  deleteCalendarEventByFloussId,
  handleBillPaidCalendarInstance,
  setStoredGoogleAccessToken,
  getStoredGoogleAccessToken,
} from './googleCalendar';

describe('buildMonthlyBillRRule', () => {
  it('generates standard monthly RRULE for days 1 through 28', () => {
    expect(buildMonthlyBillRRule(1)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=1');
    expect(buildMonthlyBillRRule(5)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=5');
    expect(buildMonthlyBillRRule(15)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=15');
    expect(buildMonthlyBillRRule(28)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=28');
  });

  it('uses BYMONTHDAY=28,29,30,31;BYSETPOS=-1 for leap and short month safety on days 29, 30, and 31', () => {
    // Days 29–31 must never be skipped in short months (e.g. February)
    expect(buildMonthlyBillRRule(29)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1');
    expect(buildMonthlyBillRRule(30)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1');
    expect(buildMonthlyBillRRule(31)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1');
  });

  it('clamps invalid or out-of-range days safely', () => {
    expect(buildMonthlyBillRRule(0)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=1');
    expect(buildMonthlyBillRRule(-5)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=1');
    expect(buildMonthlyBillRRule(32)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1');
    expect(buildMonthlyBillRRule(NaN as any)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=1');
  });
});

describe('computeReminderOverrides', () => {
  it('returns default 0-minute popup when array is empty or invalid', () => {
    expect(computeReminderOverrides([])).toEqual([{ method: 'popup', minutes: 0 }]);
    expect(computeReminderOverrides(null as any)).toEqual([{ method: 'popup', minutes: 0 }]);
    expect(computeReminderOverrides([-10, -5])).toEqual([{ method: 'popup', minutes: 0 }]);
  });

  it('deduplicates, removes negatives, and sorts in descending order', () => {
    const input = [10, 0, 10, 1440, 0, 60];
    const overrides = computeReminderOverrides(input);

    expect(overrides).toEqual([
      { method: 'popup', minutes: 1440 },
      { method: 'popup', minutes: 60 },
      { method: 'popup', minutes: 10 },
      { method: 'popup', minutes: 0 },
    ]);
  });

  it('strictly caps at maximum 5 overrides to respect Google Calendar API limit', () => {
    const input = [10080, 2880, 1440, 120, 60, 30, 15, 10, 0];
    const overrides = computeReminderOverrides(input);

    expect(overrides.length).toBe(5);
    expect(overrides).toEqual([
      { method: 'popup', minutes: 10080 },
      { method: 'popup', minutes: 2880 },
      { method: 'popup', minutes: 1440 },
      { method: 'popup', minutes: 120 },
      { method: 'popup', minutes: 60 },
    ]);
  });
});

describe('syncEntityToGoogleCalendar (Idempotent sync)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setStoredGoogleAccessToken('valid_test_token', true, 'khalid@example.com');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('creates a new Google Calendar event when none exists for the given flouss_id', async () => {
    const mockFetch = vi.fn();

    // 1. tokeninfo call for scope check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scope: 'https://www.googleapis.com/auth/calendar.events', email: 'khalid@example.com' }),
    });

    // 2. events.list call searching for existing flouss_id
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    });

    // 3. events.insert POST call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'gcal_event_123', htmlLink: 'https://calendar.google.com/event?id=123' }),
    });

    globalThis.fetch = mockFetch;

    const result = await syncEntityToGoogleCalendar({
      floussId: 'task_abc_1',
      title: 'Review Project Flouss',
      description: 'Check accounting logs',
      startDateTime: '2026-11-03T10:00:00+01:00',
      endDateTime: '2026-11-03T10:30:00+01:00',
      entityType: 'task',
      remindersMinutes: [10, 0],
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe('gcal_event_123');

    // Verify POST payload has extendedProperties with flouss_id
    const postCall = mockFetch.mock.calls[2];
    expect(postCall[0]).toContain('/calendars/primary/events');
    expect(postCall[1].method).toBe('POST');
    const body = JSON.parse(postCall[1].body);
    expect(body.extendedProperties.private.flouss_id).toBe('task_abc_1');
    expect(body.extendedProperties.private.flouss_type).toBe('task');
    expect(body.reminders.overrides).toEqual([
      { method: 'popup', minutes: 10 },
      { method: 'popup', minutes: 0 },
    ]);
  });

  it('idempotently updates existing Google Calendar event when found by flouss_id', async () => {
    const mockFetch = vi.fn();

    // 1. tokeninfo call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scope: 'https://www.googleapis.com/auth/calendar.events' }),
    });

    // 2. events.list call returns existing event
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'existing_gcal_999',
            status: 'confirmed',
            summary: 'Old Title',
          },
        ],
      }),
    });

    // 3. events.update PUT call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'existing_gcal_999', htmlLink: 'https://calendar.google.com/event?id=999' }),
    });

    globalThis.fetch = mockFetch;

    const result = await syncEntityToGoogleCalendar({
      floussId: 'bill_gym_1',
      title: 'Abonnement Salle de Sport',
      startDateTime: '2026-11-01T09:00:00+01:00',
      endDateTime: '2026-11-01T09:30:00+01:00',
      entityType: 'bill',
      rrule: 'RRULE:FREQ=MONTHLY;BYMONTHDAY=1',
      remindersMinutes: [1440, 0],
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe('existing_gcal_999');

    // Verify PUT was called on the existing event's URL
    const putCall = mockFetch.mock.calls[2];
    expect(putCall[0]).toContain('/calendars/primary/events/existing_gcal_999');
    expect(putCall[1].method).toBe('PUT');
  });

  it('detects expired token (401/403) and surfaces requiresReconnect flag', async () => {
    const mockFetch = vi.fn();

    // 1. tokeninfo call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scope: 'https://www.googleapis.com/auth/calendar.events' }),
    });

    // 2. events.list call returns 401 Unauthorized
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid Credentials' } }),
    });

    globalThis.fetch = mockFetch;

    const result = await syncEntityToGoogleCalendar({
      floussId: 'task_xyz',
      title: 'Meeting Client',
      startDateTime: '2026-11-03T14:00:00+01:00',
      endDateTime: '2026-11-03T15:00:00+01:00',
      entityType: 'meeting',
    });

    expect(result.success).toBe(false);
    expect(result.requiresReconnect).toBe(true);
    // Token is cleared from storage
    expect(getStoredGoogleAccessToken()).toBeNull();
  });
});

describe('handleBillPaidCalendarInstance', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setStoredGoogleAccessToken('valid_test_token', true, 'khalid@example.com');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('strips reminders from the specific monthly occurrence without deleting the recurring series', async () => {
    const mockFetch = vi.fn();

    // 1. events.list searching by flouss_id
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'series_parent_event_1',
            recurrence: ['RRULE:FREQ=MONTHLY;BYMONTHDAY=5'],
            summary: 'Loyer Appartement',
          },
        ],
      }),
    });

    // 2. events.instances query for 2026-11
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'instance_2026_11_sub',
            summary: 'Loyer Appartement',
          },
        ],
      }),
    });

    // 3. PATCH single instance
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'instance_2026_11_sub' }),
    });

    globalThis.fetch = mockFetch;

    const success = await handleBillPaidCalendarInstance('bill_loyer', '2026-11');
    expect(success).toBe(true);

    // Verify PATCH was called on the single instance URL with empty reminder overrides
    const patchCall = mockFetch.mock.calls[2];
    expect(patchCall[0]).toContain('/calendars/primary/events/instance_2026_11_sub');
    expect(patchCall[1].method).toBe('PATCH');
    const patchBody = JSON.parse(patchCall[1].body);
    expect(patchBody.reminders.useDefault).toBe(false);
    expect(patchBody.reminders.overrides).toEqual([]);
    expect(patchBody.status).toBe('cancelled');
  });
});

describe('deleteCalendarEventByFloussId', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setStoredGoogleAccessToken('valid_test_token', true, 'khalid@example.com');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('deletes calendar event matching the flouss_id', async () => {
    const mockFetch = vi.fn();

    // 1. Search event
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 'event_to_delete_555' }],
      }),
    });

    // 2. DELETE call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    globalThis.fetch = mockFetch;

    const result = await deleteCalendarEventByFloussId('task_old_1');
    expect(result).toBe(true);

    const deleteCall = mockFetch.mock.calls[1];
    expect(deleteCall[0]).toContain('/calendars/primary/events/event_to_delete_555');
    expect(deleteCall[1].method).toBe('DELETE');
  });
});
