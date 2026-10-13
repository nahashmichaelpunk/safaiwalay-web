/**
 * Dev-only logging. Production builds strip most `console.*` via terser; use this for intentional debug output.
 * Real production failures should go to Sentry, not the browser console.
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.error(...args);
  },
};
