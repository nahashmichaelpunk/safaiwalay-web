import type { SourceWarning } from '../types';

export interface ThresholdRule {
  metric: string;
  warnAt: number;
  criticalAt: number;
  direction: 'gt' | 'lt';
  action: string;
  meaning: string;
  treatZeroAsNoData?: boolean;
}

export const THRESHOLDS: Record<string, ThresholdRule[]> = {
  sentry: [
    {
      metric: 'totalEvents',
      warnAt: 150,
      criticalAt: 400,
      direction: 'gt',
      meaning: 'High number of Sentry events indicates rising error volume.',
      action: 'Open Sentry and inspect top issue; validate latest release and rollback if needed.',
    },
    {
      metric: 'regressedIssues',
      warnAt: 2,
      criticalAt: 5,
      direction: 'gt',
      meaning: 'Regressions indicate previously fixed issues reappeared.',
      action: 'Compare last two releases, identify regression commit, and patch hot path.',
    },
    {
      metric: 'crashFreeSessions',
      warnAt: 99.7,
      criticalAt: 99.3,
      direction: 'lt',
      meaning: 'Lower crash-free sessions directly impact user reliability.',
      action: 'Prioritize crash triage and deploy targeted fix before traffic peaks.',
    },
  ],
  ga4: [
    {
      metric: 'conversions',
      warnAt: 2,
      criticalAt: 1,
      direction: 'lt',
      meaning: 'Conversion volume dropped below expected minimum.',
      action: 'Validate booking funnel, payment flow, and top landing pages for breakage.',
      treatZeroAsNoData: true,
    },
    {
      metric: 'users',
      warnAt: 80,
      criticalAt: 40,
      direction: 'lt',
      meaning: 'Traffic dropped significantly from baseline.',
      action: 'Check acquisition channels, campaign links, and indexation regressions.',
      treatZeroAsNoData: true,
    },
  ],
  clarity: [
    {
      metric: 'rageClickSessions',
      warnAt: 15,
      criticalAt: 35,
      direction: 'gt',
      meaning: 'Rage clicks indicate frustration with UI responsiveness or broken interaction.',
      action: 'Review heatmaps and session recordings; fix high-friction controls immediately.',
    },
    {
      metric: 'deadClicks',
      warnAt: 30,
      criticalAt: 70,
      direction: 'gt',
      meaning: 'Dead clicks signal non-responsive UI elements or misleading affordances.',
      action: 'Audit clickable elements, pointer states, and event handlers on top pages.',
    },
  ],
  supabase: [
    {
      metric: 'routeError',
      warnAt: 5,
      criticalAt: 15,
      direction: 'gt',
      meaning: 'Route boundary errors indicate navigation/runtime instability.',
      action: 'Inspect recent route-level exceptions and rollback risky frontend changes.',
    },
  ],
};

function evaluate(value: number, rule: ThresholdRule): SourceWarning['severity'] | null {
  // Early-stage properties can legitimately report zero while pipelines warm up.
  // Per-rule opt-in avoids emitting false critical alerts for this case.
  if (rule.treatZeroAsNoData && value === 0) {
    return null;
  }

  if (rule.direction === 'gt') {
    if (value >= rule.criticalAt) return 'critical';
    if (value >= rule.warnAt) return 'watch';
    return null;
  }

  if (value <= rule.criticalAt) return 'critical';
  if (value <= rule.warnAt) return 'watch';
  return null;
}

export function evaluateThresholds(
  source: SourceWarning['source'],
  metrics: Record<string, number | null>
): SourceWarning[] {
  const rules = THRESHOLDS[source] ?? [];
  const warnings: SourceWarning[] = [];

  for (const rule of rules) {
    const rawValue = metrics[rule.metric];
    if (rawValue === null || Number.isNaN(rawValue)) continue;

    const severity = evaluate(rawValue, rule);
    if (!severity) continue;

    warnings.push({
      source,
      metric: rule.metric,
      severity,
      message: `${rule.meaning} Current value: ${rawValue}.`,
      action: rule.action,
    });
  }

  return warnings;
}
