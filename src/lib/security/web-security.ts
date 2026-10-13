const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:', 'tel:']);

export const EXTERNAL_DOMAIN_ALLOWLIST = [
  'safaiwalay.com',
  'wa.me',
  'api.whatsapp.com',
  'instagram.com',
  'www.instagram.com',
  'facebook.com',
  'www.facebook.com',
  'linkedin.com',
  'www.linkedin.com',
] as const;

const TELEMETRY_ALLOWED_ORIGINS = ['https://safaiwalay.com', 'https://www.safaiwalay.com', 'http://localhost:5173'] as const;
const MAX_TELEMETRY_BODY_BYTES = 8_192;

export function sanitizeExternalUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }

    if (parsed.protocol === 'https:' && !EXTERNAL_DOMAIN_ALLOWLIST.some((domain) => parsed.hostname.endsWith(domain))) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function isLikelyBotSubmission(input: {
  honeypot?: string;
  message?: string;
  firstName?: string;
  lastName?: string;
}): boolean {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return true;
  }

  const message = input.message?.trim() ?? '';
  const name = `${input.firstName ?? ''}${input.lastName ?? ''}`.trim();

  if (message.length < 10 || name.length < 2) {
    return true;
  }

  return false;
}

export function canSubmitNow(lastSubmittedAt: number | null, minDelayMs = 15000): boolean {
  if (!lastSubmittedAt) {
    return true;
  }
  return Date.now() - lastSubmittedAt >= minDelayMs;
}

export function isAllowedTelemetryOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return TELEMETRY_ALLOWED_ORIGINS.includes(origin as (typeof TELEMETRY_ALLOWED_ORIGINS)[number]);
}

export function isValidTelemetryPayload(rawBody: string): boolean {
  if (!rawBody) return false;
  if (new TextEncoder().encode(rawBody).length > MAX_TELEMETRY_BODY_BYTES) {
    return false;
  }

  try {
    const parsed = JSON.parse(rawBody) as { eventName?: unknown; params?: unknown };
    if (typeof parsed.eventName !== 'string' || parsed.eventName.length > 64) {
      return false;
    }
    if (parsed.params && typeof parsed.params !== 'object') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
