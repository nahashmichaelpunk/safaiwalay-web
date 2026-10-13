import type { DailyDigestData, MetricSeverity } from '../types';

interface TeamsFact {
  name: string;
  value: string;
}

function safe(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  return String(value);
}

function formatPercent(value: number | null | undefined, fallback = 'Not collected'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${value}%`;
}

function formatYesNoUnknown(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return 'Unknown';
  return value ? 'Yes' : 'No';
}

function severityColor(severity: MetricSeverity): string {
  switch (severity) {
    case 'critical':
      return 'E81123';
    case 'watch':
      return 'FF8C00';
    case 'unavailable':
      return '808080';
    default:
      return '107C10';
  }
}

export function deriveOverallSeverity(data: DailyDigestData): MetricSeverity {
  if (data.warnings.some((warning) => warning.severity === 'critical')) return 'critical';
  if (data.warnings.some((warning) => warning.severity === 'watch')) return 'watch';
  if (data.failures.length > 0) return 'unavailable';
  return 'healthy';
}

export function buildTeamsMessageCard(data: DailyDigestData): Record<string, unknown> {
  const overall = deriveOverallSeverity(data);
  const warningFacts: TeamsFact[] = data.warnings.map((warning) => ({
    name: `${warning.source}.${warning.metric} (${warning.severity})`,
    value: `${warning.message} Action: ${warning.action}`.slice(0, 900),
  }));

  const failureFacts: TeamsFact[] = data.failures.map((failure) => ({
    name: `${failure.source} unavailable`,
    value: failure.message,
  }));

  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: 'Daily 24h Observability Report',
    themeColor: severityColor(overall),
    title: `Daily 24h Report - SafaiWalay (${overall.toUpperCase()})`,
    sections: [
      {
        activityTitle: 'Window',
        facts: [
          { name: 'From', value: data.window.fromUtc },
          { name: 'To', value: data.window.toUtc },
          { name: 'Environment', value: 'production' },
        ],
      },
      {
        activityTitle: 'Sentry',
        facts: [
          { name: 'Total Events', value: safe(data.sentry?.totalEvents) },
          { name: 'New Issues', value: safe(data.sentry?.newIssues) },
          { name: 'Regressed Issues', value: safe(data.sentry?.regressedIssues) },
          { name: 'Resolved Issues', value: safe(data.sentry?.resolvedIssues) },
          { name: 'Crash-Free Sessions', value: formatPercent(data.sentry?.crashFreeSessions) },
          { name: 'Top Error', value: safe(data.sentry?.topError) },
        ],
      },
      {
        activityTitle: 'GA4',
        facts: [
          { name: 'Users', value: safe(data.ga4?.users) },
          { name: 'Sessions', value: safe(data.ga4?.sessions) },
          { name: 'Conversions', value: safe(data.ga4?.conversions) },
          { name: 'Revenue', value: safe(data.ga4?.revenue) },
          { name: 'Top Source/Medium', value: safe(data.ga4?.topSourceMedium) },
          { name: 'Top Landing Page', value: safe(data.ga4?.topLandingPage) },
        ],
      },
      {
        activityTitle: 'GTM',
        facts: [
          { name: 'Container Version Live', value: safe(data.gtm?.liveContainerVersion) },
          { name: 'Published in Last 24h', value: formatYesNoUnknown(data.gtm?.publishedLast24h) },
          { name: 'Workspace Changes Pending', value: safe(data.gtm?.pendingChanges) },
        ],
      },
      {
        activityTitle: 'Clarity',
        facts: [
          { name: 'Sessions', value: safe(data.clarity?.sessions) },
          { name: 'Dead Clicks', value: safe(data.clarity?.deadClicks) },
          { name: 'Rage Click Sessions', value: safe(data.clarity?.rageClickSessions) },
          { name: 'Quick Backs', value: safe(data.clarity?.quickBacks) },
        ],
      },
      {
        activityTitle: 'Supabase Telemetry',
        facts: [
          { name: 'route_error', value: safe(data.supabase?.routeError) },
          { name: 'feature_error', value: safe(data.supabase?.featureError) },
          { name: 'purchase', value: safe(data.supabase?.purchase) },
        ],
      },
      ...(warningFacts.length > 0
        ? [{ activityTitle: 'Warnings and Required Actions', facts: warningFacts }]
        : []),
      ...(failureFacts.length > 0
        ? [{ activityTitle: 'Source Failures', facts: failureFacts }]
        : []),
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'Open Sentry',
        targets: [{ os: 'default', uri: process.env.SENTRY_DASHBOARD_URL ?? 'https://sentry.io/' }],
      },
      {
        '@type': 'OpenUri',
        name: 'Open GA4',
        targets: [{ os: 'default', uri: process.env.GA4_REPORT_URL ?? 'https://analytics.google.com/' }],
      },
      {
        '@type': 'OpenUri',
        name: 'Open Clarity',
        targets: [{ os: 'default', uri: process.env.CLARITY_DASHBOARD_URL ?? 'https://clarity.microsoft.com/' }],
      },
    ],
  };
}
