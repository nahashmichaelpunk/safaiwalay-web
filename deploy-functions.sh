#!/usr/bin/env bash
# Deploys the Supabase Edge Functions and sets their secrets.
#
# Usage:
#   export RAZORPAY_KEY_ID=...            # Razorpay key id
#   export RAZORPAY_KEY_SECRET=...        # Razorpay key secret
#   export ALLOWED_TELEMETRY_ORIGINS=https://example.com,http://localhost:5173
#   export ALLOWED_ORIGIN=https://example.com   # optional: CORS origin for payment functions
#   ./deploy-functions.sh <supabase-project-ref>
#
# Secrets are read from the environment so they are never written to a tracked file.
set -euo pipefail

PROJECT_REF="${1:-}"
if [ -z "$PROJECT_REF" ]; then
  echo "Usage: ./deploy-functions.sh <supabase-project-ref>" >&2
  exit 1
fi

missing=()
for name in RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET ALLOWED_TELEMETRY_ORIGINS; do
  if [ -z "${!name:-}" ]; then
    missing+=("$name")
  fi
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "Missing required environment variables: ${missing[*]}" >&2
  exit 1
fi

functions=(
  admin-create-user
  razorpay-create-order
  razorpay-verify-payment
  telemetry-ingest
)
for fn in "${functions[@]}"; do
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF"
done

supabase secrets set \
  RAZORPAY_KEY_ID="$RAZORPAY_KEY_ID" \
  RAZORPAY_KEY_SECRET="$RAZORPAY_KEY_SECRET" \
  ALLOWED_TELEMETRY_ORIGINS="$ALLOWED_TELEMETRY_ORIGINS" \
  --project-ref "$PROJECT_REF"

if [ -n "${ALLOWED_ORIGIN:-}" ]; then
  supabase secrets set ALLOWED_ORIGIN="$ALLOWED_ORIGIN" --project-ref "$PROJECT_REF"
fi
