import type { ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';
import { monitoringConfig } from '@/lib/monitoring/config';
import { trackEvent } from '@/lib/monitoring/events';

interface BoundaryLogParams {
  boundary: string;
  severity: 'feature' | 'route' | 'root';
  error: Error;
  errorInfo?: ErrorInfo;
  routeName?: string;
  extraContext?: Record<string, unknown>;
}

let sentryInitialized = false;

/** Substrings for obvious crawlers / validators; reduces telemetry + Sentry noise without affecting real users. */
const AUTOMATED_UA_MARKERS = [
  'adsbot-google',
  'mediapartners-google',
  'playstore-google',
  'googleother',
  'google-adwords-express',
] as const;

function isLikelyAutomatedAgent(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return AUTOMATED_UA_MARKERS.some((m) => ua.includes(m));
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeTrackEvent(
  eventName: 'api_error' | 'route_error' | 'feature_error' | 'client_global_error',
  payload: Record<string, unknown>
): void {
  try {
    if (eventName === 'api_error') {
      trackEvent('api_error', payload as { endpoint: string; status?: number; message: string });
      return;
    }
    if (eventName === 'client_global_error') {
      trackEvent('client_global_error', payload as {
        source: 'window.onerror' | 'window.unhandledrejection';
        message: string;
        filename?: string;
        lineno?: number;
        colno?: number;
      });
      return;
    }
    if (eventName === 'route_error') {
      trackEvent('route_error', payload as { boundary: string; route_name: string; correlation_id: string });
      return;
    }
    trackEvent('feature_error', payload as { boundary: string; correlation_id: string });
  } catch (err) {
    logger.warn('[error-logger] telemetry emission failed', err);
  }
}

function getNonPiiSessionFingerprint(): string {
  const userAgent = navigator.userAgent.slice(0, 120);
  const locale = navigator.language;
  return `${locale}|${userAgent}`;
}

export function initGlobalErrorMonitoring(): void {
  if (sentryInitialized) return;

  if (monitoringConfig.sentryDsn) {
    Sentry.init({
      dsn: monitoringConfig.sentryDsn,
      environment: monitoringConfig.environment,
      tracesSampleRate: monitoringConfig.environment === 'production' ? 0.2 : 1,
      sendDefaultPii: false,
      normalizeDepth: 5,
      ignoreErrors: ['Script error.', /^Script error\.?$/i],
      denyUrls: [/chrome-extension:\/\//i],
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
  }

  window.addEventListener('error', (event) => {
    if (isLikelyAutomatedAgent()) return;

    const correlationId = generateCorrelationId();
    const payload: {
      source: 'window.onerror';
      message: string;
      filename?: string;
      lineno?: number;
      colno?: number;
    } = {
      source: 'window.onerror',
      message: event.message || 'Unhandled browser error',
    };
    if (event.filename) payload.filename = event.filename;
    if (typeof event.lineno === 'number' && Number.isFinite(event.lineno)) payload.lineno = event.lineno;
    if (typeof event.colno === 'number' && Number.isFinite(event.colno)) payload.colno = event.colno;

    safeTrackEvent('client_global_error', payload);
    if (monitoringConfig.sentryDsn) {
      Sentry.captureException(event.error ?? new Error(event.message), {
        tags: { source: 'window.onerror', correlation_id: correlationId },
        extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      });
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (isLikelyAutomatedAgent()) return;

    const correlationId = generateCorrelationId();
    safeTrackEvent('client_global_error', {
      source: 'window.unhandledrejection',
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
    });
    if (monitoringConfig.sentryDsn) {
      Sentry.captureException(event.reason, {
        tags: { source: 'window.unhandledrejection', correlation_id: correlationId },
      });
    }
  });

  sentryInitialized = true;
}

export function logBoundaryError({
  boundary,
  severity,
  error,
  errorInfo,
  routeName,
  extraContext,
}: BoundaryLogParams): string {
  const correlationId = generateCorrelationId();
  const normalizedMessage = error.message.slice(0, 500);
  const normalizedStack = error.stack?.slice(0, 4000);
  const normalizedComponentStack = errorInfo?.componentStack?.slice(0, 4000);
  const payload = {
    message: normalizedMessage,
    stack: normalizedStack,
    componentStack: normalizedComponentStack,
    routeName,
    sessionFingerprint: getNonPiiSessionFingerprint(),
    correlationId,
    extraContext,
    timestamp: new Date().toISOString(),
  };

  logger.error(`[${severity.toUpperCase()}][${boundary}]`, payload);

  if (severity === 'route') {
    safeTrackEvent('route_error', {
      boundary,
      route_name: routeName ?? 'unknown',
      correlation_id: correlationId,
    });
  } else {
    safeTrackEvent('feature_error', { boundary, correlation_id: correlationId });
  }

  if (monitoringConfig.sentryDsn) {
    Sentry.captureException(error, {
      level: severity === 'root' ? 'fatal' : 'error',
      tags: {
        boundary,
        severity,
        correlation_id: correlationId,
        route_name: routeName ?? 'unknown',
      },
      extra: payload,
    });
  }

  return correlationId;
}
