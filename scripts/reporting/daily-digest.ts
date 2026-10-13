import * as fs from 'node:fs';
import * as path from 'node:path';
import { MissingSecretError, withRetry, withTimeout } from './errors';
import { fetchSentryMetrics } from './clients/sentry';
import { fetchGa4Metrics } from './clients/ga4';
import { fetchGtmMetrics } from './clients/gtm';
import { fetchClarityMetrics } from './clients/clarity';
import { fetchSupabaseTelemetryMetrics } from './clients/supabase';
import { evaluateThresholds } from './config/thresholds';
import { buildTeamsMessageCard } from './formatter/teams-card';
import type {
  DailyDigestData,
  DataSourceName,
  ReportWindow,
  SourceFailure,
  SourceWarning,
} from './types';

interface CollectOptions {
  timeoutMs?: number;
  retries?: number;
}

const SOURCE_SECRET_REQUIREMENTS: Record<DataSourceName, string[]> = {
  sentry: ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG_SLUG', 'SENTRY_PROJECT_SLUG'],
  ga4: [
    'GA4_PROPERTY_ID',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'GOOGLE_OAUTH_REFRESH_TOKEN',
  ],
  gtm: [
    'GTM_ACCOUNT_ID',
    'GTM_CONTAINER_ID',
    'GTM_WORKSPACE_ID',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'GOOGLE_OAUTH_REFRESH_TOKEN',
  ],
  clarity: ['CLARITY_PROJECT_ID', 'CLARITY_API_TOKEN'],
  supabase: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new MissingSecretError(name);
  return value;
}

function redact(input: string): string {
  if (input.length < 8) return '***';
  return `${input.slice(0, 4)}***${input.slice(-4)}`;
}

function buildWindow(): ReportWindow {
  const now = new Date();
  const toUtc = now.toISOString();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fromUtc = from.toISOString();
  return { fromUtc, toUtc };
}

async function collectSource<T>(
  source: DataSourceName,
  action: () => Promise<T>,
  failures: SourceFailure[],
  options: CollectOptions = {}
): Promise<T | null> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const retries = options.retries ?? 2;
  try {
    return await withRetry(source, () => withTimeout(source, action, timeoutMs), retries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown source error';
    failures.push({ source, message });
    return null;
  }
}

function evaluateWarnings(data: DailyDigestData): SourceWarning[] {
  const warnings: SourceWarning[] = [];
  if (data.sentry) {
    warnings.push(
      ...evaluateThresholds('sentry', {
        totalEvents: data.sentry.totalEvents,
        regressedIssues: data.sentry.regressedIssues,
        crashFreeSessions: data.sentry.crashFreeSessions,
      })
    );
  }
  if (data.ga4) {
    warnings.push(
      ...evaluateThresholds('ga4', {
        conversions: data.ga4.conversions,
        users: data.ga4.users,
      })
    );
    if (data.ga4.diagnostics.length > 0) {
      warnings.push(
        ...data.ga4.diagnostics.map((detail) => ({
          source: 'ga4' as const,
          metric: 'dimensionQuery',
          severity: 'watch' as const,
          message: detail,
          action: 'Check GA4 dimensions/permissions and verify report dimensions are enabled for this property.',
        }))
      );
    }
  }
  if (data.clarity) {
    warnings.push(
      ...evaluateThresholds('clarity', {
        rageClickSessions: data.clarity.rageClickSessions,
        deadClicks: data.clarity.deadClicks,
      })
    );
  }
  if (data.supabase) {
    warnings.push(
      ...evaluateThresholds('supabase', {
        routeError: data.supabase.routeError,
      })
    );
  }
  return warnings;
}

function writeRunSummary(data: DailyDigestData): void {
  const artifactDir = path.resolve(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const summary = {
    window: data.window,
    sentry: data.sentry,
    ga4: data.ga4,
    gtm: data.gtm,
    clarity: data.clarity,
    supabase: data.supabase,
    warningCount: data.warnings.length,
    failures: data.failures,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(artifactDir, 'daily-observability-summary.json'), JSON.stringify(summary, null, 2));
}

async function postToTeams(payload: Record<string, unknown>): Promise<void> {
  const webhook = required('TEAMS_WEBHOOK_URL');
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Teams webhook failed (${response.status}): ${body.slice(0, 240)}`);
  }
}

function validateBootstrapSecrets(): void {
  required('TEAMS_WEBHOOK_URL');
}

function validateSourceSecrets(source: DataSourceName): { ok: boolean; missing: string[] } {
  const requirements = SOURCE_SECRET_REQUIREMENTS[source] ?? [];
  const missing = requirements.filter((name) => !process.env[name]?.trim());
  return { ok: missing.length === 0, missing };
}

async function main(): Promise<void> {
  validateBootstrapSecrets();
  const window = buildWindow();
  const failures: SourceFailure[] = [];
  const enabled: Record<DataSourceName, boolean> = {
    sentry: true,
    ga4: true,
    gtm: true,
    clarity: true,
    supabase: true,
  };

  (Object.keys(enabled) as DataSourceName[]).forEach((source) => {
    const check = validateSourceSecrets(source);
    if (!check.ok) {
      enabled[source] = false;
      failures.push({ source, message: `Missing secrets: ${check.missing.join(', ')}` });
    }
  });

  const sentry = enabled.sentry
    ? await collectSource('sentry', () => fetchSentryMetrics(), failures)
    : null;
  const ga4 = enabled.ga4 ? await collectSource('ga4', () => fetchGa4Metrics(window), failures) : null;
  const gtm = enabled.gtm ? await collectSource('gtm', () => fetchGtmMetrics(window), failures) : null;
  const clarity = enabled.clarity
    ? await collectSource('clarity', () => fetchClarityMetrics(window), failures)
    : null;
  const supabase = enabled.supabase
    ? await collectSource('supabase', () => fetchSupabaseTelemetryMetrics(window), failures)
    : null;

  const data: DailyDigestData = {
    window,
    sentry,
    ga4,
    gtm,
    clarity,
    supabase,
    warnings: [],
    failures,
  };
  data.warnings = evaluateWarnings(data);

  const card = buildTeamsMessageCard(data);
  await postToTeams(card);
  writeRunSummary(data);

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        window,
        warningCount: data.warnings.length,
        failureCount: data.failures.length,
        teamsWebhook: redact(required('TEAMS_WEBHOOK_URL')),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown digest failure';
  console.error(`[daily-digest] failed: ${message}`);
  process.exit(1);
});
