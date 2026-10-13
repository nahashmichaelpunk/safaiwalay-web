import { format } from 'date-fns';

/** True when `Date` is usable (not NaN). */
export function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function trimStr(s: string | null | undefined): string {
  return (s ?? '').trim();
}

/**
 * Normalizes DB `booking_time` to `HH:mm:ss` for local ISO combine.
 * Supports `H:mm`, `HH:mm`, `H:mm:ss`, `HH:mm:ss`. Returns null if unrecognized.
 */
export function normalizeBookingTimeForParse(bookingTime: string): string | null {
  const t = trimStr(bookingTime);
  if (!t) return null;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (hm) {
    const h = hm[1].padStart(2, '0');
    const m = hm[2].padStart(2, '0');
    return `${h}:${m}:00`;
  }
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(t);
  if (hms) {
    return `${hms[1].padStart(2, '0')}:${hms[2].padStart(2, '0')}:${hms[3].padStart(2, '0')}`;
  }
  return null;
}

const FALLBACK = '—';

export type BookingDisplayOptions = {
  datePattern?: string;
  timePattern?: string;
};

/**
 * Safe labels for booking service date/time. Never throws.
 * If parsing fails, shows raw date/time strings or "—".
 */
export function formatBookingDateTimeForDisplay(
  bookingDate: string | null | undefined,
  bookingTime: string | null | undefined,
  options?: BookingDisplayOptions
): { dateLabel: string; timeLabel: string; isoOrCombined: string | null } {
  const datePattern = options?.datePattern ?? 'dd MMM yyyy';
  const timePattern = options?.timePattern ?? 'hh:mm a';
  const d = trimStr(bookingDate);
  const tm = trimStr(bookingTime);

  if (!d) {
    return {
      dateLabel: FALLBACK,
      timeLabel: tm || FALLBACK,
      isoOrCombined: null,
    };
  }

  const normalizedTime = tm ? normalizeBookingTimeForParse(tm) : '00:00:00';
  if (!normalizedTime) {
    return {
      dateLabel: d,
      timeLabel: tm || FALLBACK,
      isoOrCombined: null,
    };
  }

  const combined = `${d}T${normalizedTime}`;
  const dateObj = new Date(combined);
  if (!isValidDate(dateObj)) {
    return {
      dateLabel: d,
      timeLabel: tm || FALLBACK,
      isoOrCombined: null,
    };
  }

  try {
    return {
      dateLabel: format(dateObj, datePattern),
      timeLabel: format(dateObj, timePattern),
      isoOrCombined: combined,
    };
  } catch {
    return {
      dateLabel: d,
      timeLabel: tm || FALLBACK,
      isoOrCombined: null,
    };
  }
}

/** Formats `created_at` for display/PDF; returns raw string or N/A if unparseable. */
export function formatCreatedAtLabel(
  createdAt: string | null | undefined,
  pattern = 'dd MMM yyyy'
): string {
  const s = trimStr(createdAt);
  if (!s) return 'N/A';
  const d = new Date(s);
  if (!isValidDate(d)) return s;
  try {
    return format(d, pattern);
  } catch {
    return s;
  }
}
