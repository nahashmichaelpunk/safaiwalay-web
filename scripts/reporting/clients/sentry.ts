import type { SentryMetrics } from '../types';
import { SourceFetchError } from '../errors';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SourceFetchError('sentry', `Missing env ${name}`);
  return value;
}

function buildHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${required('SENTRY_AUTH_TOKEN')}`,
    'Content-Type': 'application/json',
  };
}

async function fetchIssues(query: string): Promise<Array<{ count?: string; title?: string }>> {
  const org = required('SENTRY_ORG_SLUG');
  const project = required('SENTRY_PROJECT_SLUG');
  const url = new URL(`https://sentry.io/api/0/projects/${org}/${project}/issues/`);
  url.searchParams.set('query', query);
  url.searchParams.set('statsPeriod', '24h');
  url.searchParams.set('limit', '100');
  url.searchParams.set('sort', 'freq');

  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    const body = await response.text();
    throw new SourceFetchError(
      'sentry',
      `Issues API failed (${response.status}) for query="${query}": ${body.slice(0, 220)}`
    );
  }
  return (await response.json()) as Array<{ count?: string; title?: string }>;
}

async function fetchIssuesWithFallback(
  query: string,
  fallbackQuery: string | null
): Promise<Array<{ count?: string; title?: string }>> {
  try {
    return await fetchIssues(query);
  } catch (error) {
    if (!(error instanceof SourceFetchError) || !error.message.includes('(400)')) {
      throw error;
    }

    if (!fallbackQuery) {
      return [];
    }

    try {
      return await fetchIssues(fallbackQuery);
    } catch {
      return [];
    }
  }
}

function sumCount(issues: Array<{ count?: string }>): number {
  return issues.reduce((total, issue) => total + Number(issue.count ?? 0), 0);
}

export async function fetchSentryMetrics(): Promise<SentryMetrics> {
  const all = await fetchIssuesWithFallback('is:unresolved', null);
  const newlySeen = await fetchIssuesWithFallback('firstSeen:>=-24h', null);
  const regressed = await fetchIssuesWithFallback('is:regression', null);
  const resolved = await fetchIssuesWithFallback('is:resolved resolved:>=-24h', null);

  return {
    totalEvents: sumCount(all),
    newIssues: newlySeen.length,
    regressedIssues: regressed.length,
    resolvedIssues: resolved.length,
    crashFreeSessions: null,
    topError: all[0]?.title ?? 'No recent issues',
  };
}
