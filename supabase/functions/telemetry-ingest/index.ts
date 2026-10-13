import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 90;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-env',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

function allowedOrigins(): string[] {
  const configured =
    Deno.env.get('ALLOWED_TELEMETRY_ORIGINS') ||
    Deno.env.get('VITE_ALLOWED_TELEMETRY_ORIGINS') ||
    'https://safaiwalay.com';
  return configured
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : '';
  return {
    ...BASE_CORS_HEADERS,
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
  };
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins().includes(origin);
}

function consumeRateLimit(key: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  existing.count += 1;
  return true;
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, 500) : fallback;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) {
      console.warn('[telemetry-ingest] blocked preflight origin', { origin });
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { ...BASE_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!isAllowedOrigin(origin)) {
    console.warn('[telemetry-ingest] blocked request origin', { origin, method: req.method });
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...BASE_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  if (!consumeRateLimit(clientIp)) {
    console.warn('[telemetry-ingest] rate limit exceeded', { clientIp });
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRole) {
      throw new Error('Telemetry ingest misconfigured');
    }

    const payload = await req.json() as {
      eventName?: string;
      params?: Record<string, unknown>;
      timestamp?: string;
      page?: string;
    };

    const eventName = safeString(payload.eventName);
    if (!eventName) {
      throw new Error('Missing eventName');
    }

    const params = payload.params && typeof payload.params === 'object' ? payload.params : {};
    const env = safeString(req.headers.get('x-app-env'), 'unknown');
    const userAgent = safeString(req.headers.get('user-agent'), 'unknown');
    const pagePath = safeString(payload.page, '/');

    const supabase = createClient(supabaseUrl, serviceRole);
    const { error } = await supabase.from('telemetry_events').insert({
      event_name: eventName,
      params,
      page_path: pagePath,
      environment: env,
      user_agent: userAgent,
      source_ip: clientIp.slice(0, 120),
      occurred_at: payload.timestamp || new Date().toISOString(),
    });
    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown telemetry error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
