import { monitoringConfig } from '@/lib/monitoring/config';

const INGEST_ALLOWLIST = new Set([
  'purchase',
  'payment_failed',
  'route_error',
  'feature_error',
  'client_global_error',
  'api_error',
  'booking_validation_error',
]);

export function shouldIngestEventRemotely(eventName: string): boolean {
  return INGEST_ALLOWLIST.has(eventName);
}

export async function ingestTelemetryEvent(
  eventName: string,
  params: Record<string, unknown>
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return;

  const response = await fetch(`${supabaseUrl}/functions/v1/telemetry-ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      'x-app-env': monitoringConfig.environment,
    },
    body: JSON.stringify({
      eventName,
      params,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    }),
    keepalive: true,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Telemetry ingest failed with status ${response.status}${errorBody ? `: ${errorBody}` : ''}`
    );
  }
}
