export interface ReportWindow {
  fromUtc: string;
  toUtc: string;
}

export type MetricSeverity = 'healthy' | 'watch' | 'critical' | 'unavailable';

export interface SourceWarning {
  source: DataSourceName;
  metric: string;
  severity: Exclude<MetricSeverity, 'healthy'>;
  message: string;
  action: string;
}

export interface SourceFailure {
  source: DataSourceName;
  message: string;
}

export type DataSourceName = 'sentry' | 'ga4' | 'gtm' | 'clarity' | 'supabase';

export interface SentryMetrics {
  totalEvents: number;
  newIssues: number;
  regressedIssues: number;
  resolvedIssues: number;
  crashFreeSessions: number | null;
  topError: string;
}

export interface Ga4Metrics {
  users: number;
  sessions: number;
  conversions: number;
  revenue: number;
  topSourceMedium: string;
  topLandingPage: string;
  diagnostics: string[];
}

export interface GtmMetrics {
  liveContainerVersion: string;
  publishedLast24h: boolean | null;
  pendingChanges: number;
}

export interface ClarityMetrics {
  sessions: number;
  deadClicks: number;
  rageClickSessions: number;
  quickBacks: number;
}

export interface SupabaseTelemetryMetrics {
  routeError: number;
  featureError: number;
  /** Uncaught window errors / rejections (see client_global_error). */
  clientGlobalError: number;
  /** Application-reported fetch / API failures only. */
  apiError: number;
  purchase: number;
}

export interface DailyDigestData {
  window: ReportWindow;
  sentry: SentryMetrics | null;
  ga4: Ga4Metrics | null;
  gtm: GtmMetrics | null;
  clarity: ClarityMetrics | null;
  supabase: SupabaseTelemetryMetrics | null;
  warnings: SourceWarning[];
  failures: SourceFailure[];
}
