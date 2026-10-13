# SafaiWalay

[![CI](https://github.com/nahashmichaelpunk/safaiwalay-web/actions/workflows/ci.yml/badge.svg)](https://github.com/nahashmichaelpunk/safaiwalay-web/actions/workflows/ci.yml)

Booking and payments platform for a home-cleaning service in Nagpur, India. Customers
browse services with transparent pricing, pin their location on a map, book a slot and
pay online; staff run the business from an admin dashboard. Live at
[safaiwalay.com](https://safaiwalay.com).

This repository is a sanitized public copy of the production codebase, published for
code review. It contains no credentials, customer data or database dumps.

## Highlights

- **End-to-end booking flow**: service catalogue → price calculator → map-pinned address
  (Google Maps Places) → cart → checkout → Razorpay payment → PDF invoice.
- **Server-verified payments**: order creation and signature verification run in
  Supabase Edge Functions. The server recomputes the payable amount from the booking,
  checks the caller owns it, verifies the Razorpay HMAC signature, and treats retries
  idempotently. The browser never decides what a booking costs.
- **Domain pricing engine** (`src/lib/service-pricing.ts`): per-unit, per-sq.ft,
  per-kW and slab pricing for water tanks, with validation and human-readable summaries.
- **Role-based app**: customers, cleaning partners and admins; protected routes
  re-validate the Supabase session; admin user creation goes through an Edge Function
  that checks the caller's role server-side.
- **Production observability**: Sentry, GA4/GTM, Clarity and Meta Pixel behind a
  PII-redacting event pipeline, a first-party telemetry table, and a daily health
  digest posted to Microsoft Teams. See [docs/observability.md](docs/observability.md).
- **SEO and security hardening**: route-level metadata, JSON-LD structured data,
  generated sitemap, strict CSP / HSTS / frame / referrer headers with build-time
  inline-script hashes (`public/staticwebapp.config.json`), and an automated
  repo-hygiene gate that blocks secrets, dumps and env files.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript (strict), Vite 5, React Router 6 |
| UI | Tailwind CSS, shadcn/ui (Radix UI), Framer Motion, Lucide |
| State | Zustand (persisted cart, auth and chat stores) |
| Backend | Supabase: Auth (Google OAuth), Postgres, Edge Functions (Deno) |
| Payments | Razorpay Checkout + server-side verification |
| Maps | Google Maps JavaScript API, Places, Advanced Markers |
| Documents | jsPDF + autotable (invoices) |
| Monitoring | Sentry, GA4, Google Tag Manager, Microsoft Clarity, Meta Pixel |
| Hosting / CI | Azure Static Web Apps, GitHub Actions, Dependabot |

## Architecture

```
┌────────────────────────┐        ┌─────────────────────────────────────────┐
│ React SPA (Vite)       │        │ Supabase                                │
│  pages · components    │  anon  │  Auth ── Google OAuth                   │
│  zustand stores        ├───────►│  Postgres (users, bookings, payments…)  │
│  pricing engine        │  JWT   │  Edge Functions (Deno)                  │
└──────┬─────────────────┘        │   ├─ razorpay-create-order              │
       │ Razorpay Checkout        │   ├─ razorpay-verify-payment            │
       ▼                          │   ├─ admin-create-user                  │
┌────────────────┐                │   └─ telemetry-ingest ─► telemetry_events│
│ Razorpay       │◄───────────────┤                                         │
└────────────────┘  orders/verify └─────────────────────────────────────────┘
```

## Getting started

Requirements: Node.js 20+ and your own Supabase project (the app reads
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` at startup and will not boot without them).

```bash
git clone https://github.com/nahashmichaelpunk/safaiwalay-web.git
cd safaiwalay-web
npm ci
cp .env.example .env.local   # then fill in your own values
npm run dev                  # http://localhost:5173
```

Telemetry variables are optional in development. A **production build**
(`npm run build && npm run preview`) additionally requires the GA4, GTM, Clarity,
Meta Pixel and Sentry variables to be non-empty; this is enforced on purpose so a
release can't ship without monitoring. Any placeholder values are enough to preview locally.

The Edge Functions need `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
`ALLOWED_TELEMETRY_ORIGINS`; see [deploy-functions.sh](deploy-functions.sh).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Generate sitemap and CSP hashes, type-check (`tsc -b`), bundle |
| `npm run typecheck` | Type-check only |
| `npm run lint` | ESLint (typescript-eslint, react-hooks, react-refresh) |
| `npm test` | Unit tests for the repo-hygiene scanner (`node --test`) |
| `npm run check:hygiene` | Fail if tracked files contain secrets, dumps or env files |
| `npm run report:digest` | Build and post the daily observability digest |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
  pages/            Route-level screens (booking, checkout, admin, SEO landing pages…)
  components/       Feature components; ui/ holds shadcn primitives
  lib/              supabase client, pricing, monitoring, SEO config, security helpers
  content/          Static content for service, area and blog landing pages
supabase/
  functions/        Edge Functions (payments, admin user creation, telemetry ingest)
  migrations/       SQL migrations
scripts/
  reporting/        Daily digest: Sentry, GA4, GTM, Clarity and Supabase clients
  security/         CSP hash generator and the repo-hygiene scanner (+ tests)
docs/               Observability and operations notes
```

## Quality gates

Every push and pull request runs, with no secrets required:

1. `npm run check:hygiene`: no forbidden files or secret-like content is tracked
2. `npm test`: scanner tests, including one per leak class it must catch
3. `npm run lint`
4. `npm run build` (includes the strict TypeScript check)

## AI-assisted development

This project is built with AI assistance. AI is treated as an accelerator, not an
authority: its output has to pass the same gates as any other code (strict TypeScript,
ESLint, automated tests, a production build and the repo-hygiene scan, all enforced in
CI), and decisions about product behaviour, architecture, security and credentials stay
with the maintainer.

Preparing this public release (sanitizing the history, removing dead code, fixing lint
and type errors, the hygiene scanner and its tests, and the documentation) was done
with Claude Code, and the commit history records that with a `Co-Authored-By` trailer.

## Scope notes

- The UI is verified by type-checking, linting and a production build; there is no
  browser/component test suite yet.
- Only the telemetry and location migrations are versioned in `supabase/migrations`.
  The core business tables (users, bookings, payments, reviews, services) were created
  in the Supabase dashboard and are not reproduced here.
- Dependencies are patched to the latest in-range versions with no critical advisories.
  The remaining `npm audit` findings are build-time tooling (Tailwind 3, Vite 5, ESLint
  transitive packages) and React Router 6, which need major-version migrations that are
  tracked separately rather than forced in here.
- `@supabase/supabase-js` is pinned to 2.48.0 on purpose: `src/lib/database.types.ts` is
  hand-written, and newer client versions require generated types (`Relationships`).
  Upgrading means generating types with the Supabase CLI first; it carries one
  low-severity `auth-js` advisory until then.
- Production deployment and the scheduled digest run from a private repository; the
  workflows here are manual-only so forks never attempt a deploy.

## Security

See [SECURITY.md](SECURITY.md). Please report vulnerabilities privately.

## License

Copyright © SafaiWalay. All rights reserved. The source is published for review and
evaluation purposes; contact the repository owner before reusing it.
