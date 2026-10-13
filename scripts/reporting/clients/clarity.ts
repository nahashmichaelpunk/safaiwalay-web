import type { ClarityMetrics, ReportWindow } from '../types';
import { SourceFetchError } from '../errors';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SourceFetchError('clarity', `Missing env ${name}`);
  return value;
}

async function tryFetch(
  url: string,
  token: string
): Promise<Record<string, unknown> | null> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

export async function fetchClarityMetrics(window: ReportWindow): Promise<ClarityMetrics> {
  const projectId = required('CLARITY_PROJECT_ID');
  const token = required('CLARITY_API_TOKEN');
  const from = window.fromUtc;
  const to = window.toUtc;

  const candidates = [
    `https://www.clarity.ms/export-data/api/v1/project-live-insights?projectId=${projectId}`,
    `https://www.clarity.ms/export-data/api/v1/project-insights?projectId=${projectId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  ];

  let json: Record<string, unknown> | null = null;
  for (const endpoint of candidates) {
    json = await tryFetch(endpoint, token);
    if (json) break;
  }

  if (!json) {
    throw new SourceFetchError('clarity', 'Failed to fetch Clarity insights from available endpoints');
  }

  return {
    sessions: asNumber(json.sessions),
    deadClicks: asNumber(json.deadClicks),
    rageClickSessions: asNumber(json.rageClicks),
    quickBacks: asNumber(json.quickbacks ?? json.quickBacks),
  };
}
