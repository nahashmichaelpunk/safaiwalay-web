import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { assertMonitoringConfig, monitoringConfig } from '@/lib/monitoring/config';
import { trackEvent, trackMetaPageView, trackPageView, trackSessionLifecycle } from '@/lib/monitoring/events';
export { trackEvent } from '@/lib/monitoring/events';

function loadScript(src: string, id: string): void {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

const META_PIXEL_INIT_KEY = '__swMetaPixelId';

function ensureMetaPixelStub(): void {
  if (window.fbq) return;
  const fbq = (...args: unknown[]) => {
    const q = fbq as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[][] };
    if (q.callMethod) {
      q.callMethod(...args);
    } else {
      q.queue.push(args);
    }
  };
  const stub = fbq as unknown as {
    queue: unknown[][];
    loaded: boolean;
    version: string;
    push: typeof fbq;
  };
  stub.queue = [];
  stub.loaded = true;
  stub.version = '2.0';
  stub.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;
}

function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined') return;
  ensureMetaPixelStub();
  if (!document.getElementById('sw-meta-pixel-script')) {
    loadScript('https://connect.facebook.net/en_US/fbevents.js', 'sw-meta-pixel-script');
  }
  const w = window as unknown as Record<string, string | undefined>;
  if (w[META_PIXEL_INIT_KEY] === pixelId) return;
  window.fbq?.('init', pixelId);
  w[META_PIXEL_INIT_KEY] = pixelId;
}

function initGtmContainer(gtmId: string): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  });
  loadScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`, 'sw-gtm-script');
}

export const initMonitoring = () => {
  if (typeof window === 'undefined') return;

  assertMonitoringConfig();

  window.dataLayer = window.dataLayer || [];

  if (monitoringConfig.gtmId) {
    initGtmContainer(monitoringConfig.gtmId);
  }

  if (monitoringConfig.gaMeasurementId) {
    loadScript(
      `https://www.googletagmanager.com/gtag/js?id=${monitoringConfig.gaMeasurementId}`,
      'sw-ga4-script'
    );
    const gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', monitoringConfig.gaMeasurementId, {
      send_page_view: false,
      anonymize_ip: true,
    });
  }
  if (monitoringConfig.clarityProjectId) {
    window.clarity =
      window.clarity ||
      ((...args: unknown[]) => {
        (window.clarity as ((...args: unknown[]) => void) & { q?: unknown[] }).q =
          (window.clarity as ((...args: unknown[]) => void) & { q?: unknown[] }).q || [];
        (window.clarity as ((...args: unknown[]) => void) & { q?: unknown[] }).q?.push(args);
      });
    loadScript(
      `https://www.clarity.ms/tag/${monitoringConfig.clarityProjectId}`,
      'sw-clarity-script'
    );
  }
  if (monitoringConfig.metaPixelId) {
    initMetaPixel(monitoringConfig.metaPixelId);
  }
};

// Backward-compatible wrappers used in existing components.
export const initGA = initMonitoring;
export const trackLegacyEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => trackEvent('seo_metric', { metric: `${category}:${action}${label ? `:${label}` : ''}`, value: value ?? 1 });
export const trackConversion = (conversionId: string, value?: number, currency = 'INR') =>
  trackEvent('purchase', {
    booking_id: conversionId,
    service_name: 'unknown',
    value: value ?? 0,
    currency: currency as 'INR',
  });
export const trackUserInteraction = (interaction: string, element: string) =>
  trackEvent('click_service_cta', { location: interaction, target: element });
export const trackServiceBooking = (serviceName: string, price: number, area: string) =>
  trackEvent('start_booking', { service_id: area, service_name: serviceName });
export const trackFormSubmission = (formName: string, success = true) =>
  trackEvent('form_submit', { form_name: formName, success });
export const trackPhoneCall = (_phoneNumber: string, location = 'unknown') =>
  trackEvent('call_click', { location });
export const trackEmailClick = (_emailAddress: string, location = 'unknown') =>
  trackEvent('email_click', { location });
export const trackSocialClick = (platform: string, location = 'unknown') =>
  platform.toLowerCase() === 'whatsapp'
    ? trackEvent('whatsapp_click', { location })
    : trackEvent('social_click', { platform, location });

export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    initMonitoring();
    trackSessionLifecycle();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
    trackMetaPageView();
  }, [location]);

  return null;
}
