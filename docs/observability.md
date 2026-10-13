# Observability

SafaiWalay ships with a layered observability stack: client-side error capture,
privacy-safe product analytics, a first-party telemetry table for business-critical
events, and a daily digest that pulls everything into one Microsoft Teams card.

```
Browser
  ├─ Sentry (errors, 20% trace sampling in production)
  ├─ GA4 + GTM + Microsoft Clarity + Meta Pixel (analytics)
  └─ sanitize ──► telemetry-ingest (Supabase Edge Function) ──► telemetry_events (Postgres)

GitHub Actions (daily-digest) ──► Sentry · GA4 · GTM · Clarity · telemetry_events ──► Teams card
```

## 1. Client telemetry

All events go through `trackEvent()` in `src/lib/monitoring/events.ts`, which:

1. **Sanitizes** the event (`sanitize-event.ts`): event and parameter names must match
   `^[a-z][a-z0-9_]{1,39}$`, at most 40 params, string values capped at 256 chars,
   e-mail addresses and phone numbers replaced with `[redacted_email]` /
   `[redacted_phone]`, whole payload capped at 4,000 characters.
2. **Gates by origin**: events are dropped unless `window.location.origin` is in
   `VITE_ALLOWED_TELEMETRY_ORIGINS` (it defaults to the current origin when unset), so
   previews and forks never pollute production data.
3. **Fans out** to GA4 (`gtag`), the GTM `dataLayer`, and Clarity.
4. **Ingests remotely** only an allowlist of business-critical events:
   `purchase`, `payment_failed`, `booking_validation_error`, `route_error`,
   `feature_error`, `client_global_error`, `api_error`.

Rules for new events: `snake_case`, no raw PII (no e-mail, phone, address or payment
identifiers; booking UUIDs only), and add new keys rather than renaming existing ones.
The typed catalogue lives in `TelemetryEventMap`.

| Group | Events |
| --- | --- |
| Session | `session_start`, `first_visit`, `return_visit` |
| Discovery | `page_view`, `view_home`, `view_services`, `view_service`, `view_area_page`, `view_blog_list`, `view_blog_post` |
| Engagement | `click_service_cta`, `click_blog_cta`, `whatsapp_click`, `social_click`, `call_click`, `email_click`, `form_start`, `form_submit`, `login_success` |
| Funnel | `start_booking`, `booking_validation_error`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `booking_confirmed`, `payment_started`, `payment_failed`, `purchase`, `repeat_booking_detected` |
| Quality | `web_vital`, `seo_issue`, `seo_metric`, `route_error`, `feature_error`, `client_global_error`, `api_error` |

Booking funnel: `view_service` → `start_booking` → `add_to_cart` → `begin_checkout` →
`booking_confirmed` → `payment_started` → `purchase`.

## 2. Error boundaries and Sentry

`AppErrorBoundary`, `RoutedSegmentErrorBoundary`/`RouteErrorBoundary` and
`FeatureErrorBoundary` isolate failures at app, route and feature level. Each one logs
through `logBoundaryError()`, which attaches a correlation ID and sends the error to
Sentry (when `VITE_SENTRY_DSN` is set) and a `route_error` / `feature_error` telemetry
event. Global `error` and `unhandledrejection` handlers report `client_global_error`.
Sentry is initialised with `sendDefaultPii: false` and strips `authorization` and
`cookie` headers in `beforeSend`. Known ad-crawler user agents are ignored to keep the
signal clean.

In production builds `assertMonitoringConfig()` fails fast if any of the GA4, GTM,
Clarity, Meta Pixel or Sentry variables is missing, so a deploy can't silently ship
without telemetry.

## 3. Server-side ingest

`supabase/functions/telemetry-ingest` accepts `POST` only and enforces:

- **Origin allowlist** from `ALLOWED_TELEMETRY_ORIGINS` (403 otherwise, including on
  `OPTIONS` preflight). This is a separate setting from the frontend's
  `VITE_ALLOWED_TELEMETRY_ORIGINS`; both must be set.
- **Rate limit** of 90 requests per minute per client IP (in-memory, per function instance).
- **Payload shaping**: event name required, strings truncated to 500 chars.
- Writes with the service-role key into `public.telemetry_events`, whose Row Level
  Security (see `supabase/migrations/20260427195000_create_telemetry_events.sql`)
  allows inserts only by `service_role` and reads only by users whose
  `users.user_role = 'admin'`.

Post-deploy verification:

- `OPTIONS` from an allowed origin returns success with a matching
  `Access-Control-Allow-Origin`.
- `POST` from an allowed origin returns `{ "ok": true }`.
- A request from any other origin returns `403` with a JSON error body.

## 4. Daily digest

`npm run report:digest` (`scripts/reporting/daily-digest.ts`) builds a report for the
last 24 hours (UTC) and posts it to a Microsoft Teams webhook. The GitHub Actions
workflow `.github/workflows/daily-observability-digest.yml` runs it on a schedule
(06:30 IST in production; manual-only in this public copy).

Design goals: one flaky source must never take the report down.

- Each source (Sentry, GA4, GTM, Clarity, Supabase) is validated, fetched and
  evaluated **independently**. A missing secret or API failure marks that source as
  unavailable and the card still posts, with a *Source Failures* section.
- Per-source **15 s timeout** and **2 retries** with exponential backoff (500 ms base).
- Only `TEAMS_WEBHOOK_URL` is required to start; everything else degrades gracefully.
- Logs never print secrets (the webhook is redacted) and a redacted run summary is
  uploaded as the `daily-observability-summary` artifact.

Required GitHub Actions secrets:

| Source | Secrets |
| --- | --- |
| Teams (required) | `TEAMS_WEBHOOK_URL` |
| Sentry | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`, optional `SENTRY_DASHBOARD_URL` |
| GA4 | `GA4_PROPERTY_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, optional `GA4_REPORT_URL` |
| GTM | `GTM_ACCOUNT_ID`, `GTM_CONTAINER_ID`, `GTM_WORKSPACE_ID` (+ the Google OAuth trio above) |
| Clarity | `CLARITY_PROJECT_ID`, `CLARITY_API_TOKEN`, optional `CLARITY_DASHBOARD_URL` |
| Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

### Alert thresholds

Defined in `scripts/reporting/config/thresholds.ts`. A metric at or beyond the
*critical* value is `critical`; at or beyond *warn* it is `watch`. Metrics that
legitimately read zero while a young property warms up opt out via `treatZeroAsNoData`.

| Source | Metric | Direction | Watch | Critical |
| --- | --- | --- | --- | --- |
| Sentry | `totalEvents` | high | ≥ 150 | ≥ 400 |
| Sentry | `regressedIssues` | high | ≥ 2 | ≥ 5 |
| Sentry | `crashFreeSessions` | low | ≤ 99.7 | ≤ 99.3 |
| GA4 | `conversions` | low | ≤ 2 | ≤ 1 |
| GA4 | `users` | low | ≤ 80 | ≤ 40 |
| Clarity | `rageClickSessions` | high | ≥ 15 | ≥ 35 |
| Clarity | `deadClicks` | high | ≥ 30 | ≥ 70 |
| Supabase | `routeError` | high | ≥ 5 | ≥ 15 |

Severity meanings: `healthy` (no breach), `watch` (investigate the same business
day), `critical` (immediate incident action), `unavailable` (the source is blind;
restore visibility first).

## 5. Supabase function deployment

```bash
export RAZORPAY_KEY_ID=...
export RAZORPAY_KEY_SECRET=...
export ALLOWED_TELEMETRY_ORIGINS=https://your-domain.example,http://localhost:5173
./deploy-functions.sh <supabase-project-ref>
```

The script deploys `admin-create-user`, `razorpay-create-order`,
`razorpay-verify-payment` and `telemetry-ingest`, and sets their secrets from your
shell environment so nothing sensitive is ever written to a tracked file.
