# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](../../security/advisories/new) for this repository
rather than opening a public issue.

## Handling of secrets and data

- No credentials, database dumps or `.env` files are stored in this repository.
  `npm run check:hygiene` (also run in CI) fails the build if any forbidden file or
  secret-like string is tracked.
- Browser-exposed configuration (`VITE_*`) is limited to public identifiers. Server
  secrets live in Supabase function secrets or GitHub Actions secrets.
- Privileged operations (payment order creation and verification, admin user
  creation, telemetry ingest) run in Supabase Edge Functions that authenticate the
  caller and re-check ownership / role server-side before using the service-role key.
- The telemetry table is protected by Row Level Security in
  `supabase/migrations/20260427195000_create_telemetry_events.sql`.
