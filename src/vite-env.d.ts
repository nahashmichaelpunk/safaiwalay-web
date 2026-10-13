/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAP_ID?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_ALLOWED_TELEMETRY_ORIGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
