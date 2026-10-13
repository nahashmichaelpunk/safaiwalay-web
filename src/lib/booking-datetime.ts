import { normalizeBookingTimeForParse } from '@/lib/safe-dates';

/**
 * Combine DB `booking_date` (YYYY-MM-DD) and `booking_time` (HH:mm or HH:mm:ss) for display/parsing.
 * Returns empty string if date is missing or time cannot be normalized (callers should handle '').
 */
export function combineBookingDateTime(bookingDate: string, bookingTime: string): string {
  const d = (bookingDate ?? '').trim();
  if (!d) return '';
  const tmRaw = (bookingTime ?? '').trim();
  const normalizedTime = tmRaw ? normalizeBookingTimeForParse(tmRaw) : '00:00:00';
  if (!normalizedTime) return '';
  return `${d}T${normalizedTime}`;
}
