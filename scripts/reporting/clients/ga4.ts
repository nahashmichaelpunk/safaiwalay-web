import type { Ga4Metrics, ReportWindow } from '../types';
import { SourceFetchError } from '../errors';
import { getGoogleAccessToken } from './google-auth';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SourceFetchError('ga4', `Missing env ${name}`);
  return value;
}

function extractMetricValue(
  row: { metricValues?: Array<{ value?: string }> } | undefined,
  index: number
): number {
  return Number(row?.metricValues?.[index]?.value ?? 0);
}

export async function fetchGa4Metrics(window: ReportWindow): Promise<Ga4Metrics> {
  const propertyId = required('GA4_PROPERTY_ID');

  const accessToken = await getGoogleAccessToken(
    ['https://www.googleapis.com/auth/analytics.readonly'],
    { serviceAccountRaw: process.env.GA4_SERVICE_ACCOUNT_JSON?.trim() }
  );

  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const body = {
    dateRanges: [{ startDate: window.fromUtc.slice(0, 10), endDate: window.toUtc.slice(0, 10) }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'conversions' }, { name: 'totalRevenue' }],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new SourceFetchError('ga4', `runReport failed (${response.status}): ${message.slice(0, 200)}`);
  }

  const metricsJson = (await response.json()) as {
    rows?: Array<{ metricValues?: Array<{ value?: string }> }>;
  };
  const firstRow = metricsJson.rows?.[0];

  const diagnostics: string[] = [];
  const topSource = await fetchGa4TopDimension(accessToken, propertyId, window, 'sessionSourceMedium');
  if (topSource.diagnostic) diagnostics.push(topSource.diagnostic);
  const topLanding = await fetchGa4TopDimension(accessToken, propertyId, window, 'landingPagePlusQueryString');
  if (topLanding.diagnostic) diagnostics.push(topLanding.diagnostic);

  return {
    users: extractMetricValue(firstRow, 0),
    sessions: extractMetricValue(firstRow, 1),
    conversions: extractMetricValue(firstRow, 2),
    revenue: extractMetricValue(firstRow, 3),
    topSourceMedium: topSource.value,
    topLandingPage: topLanding.value,
    diagnostics,
  };
}

async function fetchGa4TopDimension(
  accessToken: string,
  propertyId: string,
  window: ReportWindow,
  dimension: string
): Promise<{ value: string; diagnostic?: string }> {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: window.fromUtc.slice(0, 10), endDate: window.toUtc.slice(0, 10) }],
      dimensions: [{ name: dimension }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 1,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return {
      value: 'Unavailable',
      diagnostic: `GA4 dimension query failed for ${dimension} (${response.status}): ${message.slice(0, 160)}`,
    };
  }

  const json = (await response.json()) as {
    rows?: Array<{ dimensionValues?: Array<{ value?: string }> }>;
  };
  return { value: json.rows?.[0]?.dimensionValues?.[0]?.value ?? 'Unavailable' };
}
