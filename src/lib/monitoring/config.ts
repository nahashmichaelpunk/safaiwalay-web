type RuntimeEnvironment = 'development' | 'staging' | 'production';

interface MonitoringConfig {
  environment: RuntimeEnvironment;
  gaMeasurementId: string | null;
  gtmId: string | null;
  clarityProjectId: string | null;
  metaPixelId: string | null;
  sentryDsn: string | null;
  allowedTelemetryOrigins: string[];
}

function readOptional(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveEnvironment(): RuntimeEnvironment {
  const configured = readOptional(import.meta.env.VITE_APP_ENV);
  if (configured === 'development' || configured === 'staging' || configured === 'production') {
    return configured;
  }
  return import.meta.env.PROD ? 'production' : 'development';
}

function resolveAllowedOrigins(): string[] {
  const configured = readOptional(import.meta.env.VITE_ALLOWED_TELEMETRY_ORIGINS);
  if (!configured) {
    return [window.location.origin];
  }
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const monitoringConfig: MonitoringConfig = {
  environment: resolveEnvironment(),
  gaMeasurementId: readOptional(import.meta.env.VITE_GA_MEASUREMENT_ID),
  gtmId: readOptional(import.meta.env.VITE_GTM_ID),
  clarityProjectId: readOptional(import.meta.env.VITE_CLARITY_PROJECT_ID),
  metaPixelId: readOptional(import.meta.env.VITE_META_PIXEL_ID),
  sentryDsn: readOptional(import.meta.env.VITE_SENTRY_DSN),
  allowedTelemetryOrigins: resolveAllowedOrigins(),
};

export function assertMonitoringConfig(): void {
  if (!import.meta.env.PROD) {
    return;
  }

  const missing: string[] = [];
  if (!monitoringConfig.gaMeasurementId) missing.push('VITE_GA_MEASUREMENT_ID');
  if (!monitoringConfig.gtmId) missing.push('VITE_GTM_ID');
  if (!monitoringConfig.clarityProjectId) missing.push('VITE_CLARITY_PROJECT_ID');
  if (!monitoringConfig.metaPixelId) missing.push('VITE_META_PIXEL_ID');
  if (!monitoringConfig.sentryDsn) missing.push('VITE_SENTRY_DSN');

  if (missing.length > 0) {
    throw new Error(
      `Missing required monitoring environment variables: ${missing.join(', ')}. ` +
        'Telemetry is required in production.'
    );
  }
}
