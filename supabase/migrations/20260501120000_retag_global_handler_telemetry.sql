-- Retag historical rows: global browser handlers were mislabeled as api_error.
update public.telemetry_events
set event_name = 'client_global_error'
where event_name = 'api_error'
  and params->>'endpoint' in ('window.onerror', 'window.unhandledrejection');
