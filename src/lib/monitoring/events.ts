import { sanitizeTelemetryEvent } from '@/lib/monitoring/sanitize-event';
import { monitoringConfig } from '@/lib/monitoring/config';
import { ingestTelemetryEvent, shouldIngestEventRemotely } from '@/lib/monitoring/ingest';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export type TelemetryEventMap = {
  session_start: { session_id: string; environment: string };
  first_visit: { session_id: string };
  return_visit: { session_id: string; days_since_last_visit: number };
  page_view: { page_path: string; page_title: string; route_group: string };
  view_home: { source?: string };
  view_services: { source?: string };
  view_service: { service_id: string; service_name: string };
  view_area_page: { area_slug: string };
  view_blog_list: Record<string, never>;
  view_blog_post: { slug: string; category?: string };
  click_service_cta: { location: string; target: string };
  click_blog_cta: { slug: string; target: string };
  start_booking: { service_id: string; service_name: string };
  booking_validation_error: { field: string; reason: string; service_id: string };
  add_to_cart: { service_id: string; service_name: string; value: number };
  remove_from_cart: { service_id: string; service_name: string; value: number };
  begin_checkout: { cart_size: number; value: number };
  booking_confirmed: { booking_id: string; service_name: string; value: number };
  payment_started: { booking_id: string; value: number };
  payment_failed: { booking_id?: string; reason: string };
  purchase: { booking_id: string; service_name: string; value: number; currency: 'INR' };
  whatsapp_click: { location: string };
  social_click: { platform: string; location: string };
  call_click: { location: string };
  email_click: { location: string };
  form_start: { form_name: string };
  form_submit: { form_name: string; success: boolean };
  login_success: { method: 'google' | 'email' };
  repeat_booking_detected: { count: number };
  web_vital: { metric_name: string; metric_value: number };
  route_error: { boundary: string; route_name: string; correlation_id: string };
  feature_error: { boundary: string; correlation_id: string };
  /** Uncaught window error / unhandled rejection (not application-reported fetch failures). */
  client_global_error: {
    source: 'window.onerror' | 'window.unhandledrejection';
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  };
  api_error: { endpoint: string; status?: number; message: string };
  seo_issue: { issue: string; count: number };
  seo_metric: { metric: string; value: number };
};

export type TelemetryEventName = keyof TelemetryEventMap;

const SESSION_KEY = 'sw_session_id';
const LAST_VISIT_KEY = 'sw_last_visit_at';
const RECENT_EVENTS_MAX = 200;
const recentEvents = new Set<string>();

function makeSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId(): string {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    return stored;
  }
  const generated = makeSessionId();
  sessionStorage.setItem(SESSION_KEY, generated);
  return generated;
}

function markRecentEvent(key: string): boolean {
  if (recentEvents.has(key)) {
    return false;
  }
  recentEvents.add(key);
  if (recentEvents.size > RECENT_EVENTS_MAX) {
    const first = recentEvents.values().next().value as string | undefined;
    if (first) recentEvents.delete(first);
  }
  return true;
}

export function trackEvent<K extends TelemetryEventName>(
  eventName: K,
  params: TelemetryEventMap[K],
  options?: { dedupeKey?: string }
): void {
  if (options?.dedupeKey && !markRecentEvent(`${eventName}:${options.dedupeKey}`)) {
    return;
  }

  const safe = sanitizeTelemetryEvent(eventName, params as Record<string, unknown>);
  if (!safe) {
    return;
  }

  if (window.gtag && monitoringConfig.gaMeasurementId) {
    window.gtag('event', safe.eventName, safe.params);
  }

  if (window.dataLayer) {
    window.dataLayer.push({
      event: safe.eventName,
      ...safe.params,
    });
  }

  if (window.clarity) {
    window.clarity('event', safe.eventName);
  }

  if (shouldIngestEventRemotely(safe.eventName)) {
    void ingestTelemetryEvent(safe.eventName, safe.params as Record<string, unknown>).catch(() => {
      // Swallow telemetry transport errors to avoid impacting user experience.
    });
  }
}

export function trackPageView(pathname: string, pageTitle: string): void {
  const routeGroup = pathname.split('/')[1] || 'home';
  trackEvent(
    'page_view',
    {
      page_path: pathname,
      page_title: pageTitle,
      route_group: routeGroup,
    },
    { dedupeKey: pathname }
  );
}

export function trackMetaPageView(): void {
  if (!monitoringConfig.metaPixelId) return;
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

const META_CURRENCY = 'INR';

function metaPixelReady(): boolean {
  return !!(monitoringConfig.metaPixelId && typeof window !== 'undefined' && window.fbq);
}

/** Use the same IDs in your Meta product catalog (`content_ids` === catalog `id`). */
export function trackMetaViewCatalogServices(contentIds: string[]): void {
  if (!metaPixelReady() || contentIds.length === 0) return;
  window.fbq!('track', 'ViewCategory', {
    content_name: 'SafaiWalay Cleaning Services',
    content_category: 'services',
    content_ids: contentIds,
    content_type: 'product',
  });
}

export function trackMetaViewContent(params: {
  contentId: string;
  contentName: string;
  value?: number;
  contentCategory?: string;
}): void {
  if (!metaPixelReady()) return;
  const hasValue = params.value != null && Number.isFinite(params.value);
  const contents = [
    {
      id: params.contentId,
      quantity: 1 as const,
      ...(hasValue ? { item_price: params.value as number } : {}),
    },
  ];
  window.fbq!('track', 'ViewContent', {
    content_ids: [params.contentId],
    content_type: 'product',
    content_name: params.contentName,
    ...(params.contentCategory ? { content_category: params.contentCategory } : {}),
    ...(hasValue ? { value: params.value as number } : {}),
    currency: META_CURRENCY,
    contents,
  });
}

export function trackMetaAddToCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  quantity?: number;
}): void {
  if (!metaPixelReady()) return;
  const qty = params.quantity ?? 1;
  window.fbq!('track', 'AddToCart', {
    content_ids: [params.contentId],
    content_type: 'product',
    content_name: params.contentName,
    value: params.value * qty,
    currency: META_CURRENCY,
    contents: [{ id: params.contentId, quantity: qty, item_price: params.value }],
  });
}

export function trackMetaInitiateCheckout(payload: {
  contentIds: string[];
  contents: Array<{ id: string; quantity: number; item_price?: number }>;
  value: number;
  numItems: number;
}): void {
  if (!metaPixelReady()) return;
  window.fbq!('track', 'InitiateCheckout', {
    content_ids: payload.contentIds,
    content_type: 'product',
    currency: META_CURRENCY,
    value: payload.value,
    num_items: payload.numItems,
    contents: payload.contents,
  });
}

export function trackMetaPurchase(payload: {
  contentIds: string[];
  contents: Array<{ id: string; quantity: number; item_price?: number }>;
  value: number;
  numItems: number;
}): void {
  if (!metaPixelReady()) return;
  window.fbq!('track', 'Purchase', {
    content_ids: payload.contentIds,
    content_type: 'product',
    currency: META_CURRENCY,
    value: payload.value,
    num_items: payload.numItems,
    contents: payload.contents,
  });
}

export function trackSessionLifecycle(): void {
  const sessionId = getSessionId();
  trackEvent('session_start', { session_id: sessionId, environment: monitoringConfig.environment });

  const now = Date.now();
  const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) || '0');
  if (!lastVisit) {
    trackEvent('first_visit', { session_id: sessionId });
  } else {
    const daysSince = Math.max(0, Math.round((now - lastVisit) / (1000 * 60 * 60 * 24)));
    trackEvent('return_visit', {
      session_id: sessionId,
      days_since_last_visit: daysSince,
    });
  }
  localStorage.setItem(LAST_VISIT_KEY, String(now));
}
