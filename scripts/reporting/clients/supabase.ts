import type { ReportWindow, SupabaseTelemetryMetrics } from '../types';
import { SourceFetchError } from '../errors';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SourceFetchError('supabase', `Missing env ${name}`);
  return value;
}

async function fetchCountForEvent(
  supabaseUrl: string,
  serviceRoleKey: string,
  eventName: string,
  fromUtc: string
): Promise<number> {
  const url = new URL(`${supabaseUrl}/rest/v1/telemetry_events`);
  url.searchParams.set('select', 'id');
  url.searchParams.set('event_name', `eq.${eventName}`);
  url.searchParams.set('occurred_at', `gte.${fromUtc}`);

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'count=exact',
    },
  });

  if (!response.ok) {
    throw new SourceFetchError('supabase', `Telemetry query failed for ${eventName} (${response.status})`);
  }

  const contentRange = response.headers.get('content-range') ?? '';
  const total = Number(contentRange.split('/')[1] ?? 0);
  return Number.isFinite(total) ? total : 0;
}

export async function fetchSupabaseTelemetryMetrics(
  window: ReportWindow
): Promise<SupabaseTelemetryMetrics> {
  const supabaseUrl = required('SUPABASE_URL');
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');

  const [routeError, featureError, clientGlobalError, apiError, purchase] = await Promise.all([
    fetchCountForEvent(supabaseUrl, serviceRoleKey, 'route_error', window.fromUtc),
    fetchCountForEvent(supabaseUrl, serviceRoleKey, 'feature_error', window.fromUtc),
    fetchCountForEvent(supabaseUrl, serviceRoleKey, 'client_global_error', window.fromUtc),
    fetchCountForEvent(supabaseUrl, serviceRoleKey, 'api_error', window.fromUtc),
    fetchCountForEvent(supabaseUrl, serviceRoleKey, 'purchase', window.fromUtc),
  ]);

  return {
    routeError,
    featureError,
    clientGlobalError,
    apiError,
    purchase,
  };
}
