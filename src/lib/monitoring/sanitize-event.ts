import { monitoringConfig } from '@/lib/monitoring/config';

const MAX_PARAM_COUNT = 40;
const MAX_VALUE_LENGTH = 256;
const MAX_PAYLOAD_CHARS = 4000;
const ALLOWED_EVENT_NAME = /^[a-z][a-z0-9_]{1,39}$/;
const ALLOWED_PARAM_KEY = /^[a-z][a-z0-9_]{1,39}$/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(\+?\d[\d\s\-()]{7,}\d)/g;

type Primitive = string | number | boolean | null | undefined;
type TelemetryValue = Primitive | Primitive[];

export interface SafeTelemetryEvent {
  eventName: string;
  params: Record<string, TelemetryValue>;
}

function redactPII(input: string): string {
  return input.replace(EMAIL_PATTERN, '[redacted_email]').replace(PHONE_PATTERN, '[redacted_phone]');
}

function sanitizeString(value: string): string {
  const redacted = redactPII(value).trim();
  return redacted.slice(0, MAX_VALUE_LENGTH);
}

function normalizeValue(value: unknown): TelemetryValue {
  if (Array.isArray(value)) {
    return value
      .slice(0, 10)
      .map((item) => normalizeValue(item))
      .flatMap((item) => (item === undefined ? [] : [item])) as Primitive[];
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value == null) {
    return null;
  }
  return sanitizeString(String(value));
}

function isTelemetryOriginAllowed(): boolean {
  const currentOrigin = window.location.origin;
  return monitoringConfig.allowedTelemetryOrigins.some((allowed) => allowed === currentOrigin);
}

export function sanitizeTelemetryEvent(
  eventName: string,
  rawParams: Record<string, unknown>
): SafeTelemetryEvent | null {
  if (!isTelemetryOriginAllowed()) {
    return null;
  }

  const normalizedName = eventName.trim().toLowerCase();
  if (!ALLOWED_EVENT_NAME.test(normalizedName)) {
    return null;
  }

  const params: Record<string, TelemetryValue> = {};
  const keys = Object.keys(rawParams).slice(0, MAX_PARAM_COUNT);
  for (const key of keys) {
    const normalizedKey = key.trim().toLowerCase();
    if (!ALLOWED_PARAM_KEY.test(normalizedKey)) {
      continue;
    }
    const value = normalizeValue(rawParams[key]);
    if (value !== undefined) {
      params[normalizedKey] = value;
    }
  }

  const serialized = JSON.stringify({ event: normalizedName, params });
  if (serialized.length > MAX_PAYLOAD_CHARS) {
    return {
      eventName: normalizedName,
      params: { payload_truncated: true },
    };
  }

  return { eventName: normalizedName, params };
}
