import * as Sentry from '@sentry/react';

export default function SentryErrorTestButton() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Sentry Error Test</h1>
      <p className="mt-2 text-sm text-slate-600">
        Click this button to intentionally throw a test error and verify Sentry issue capture.
      </p>
      <button
        type="button"
        className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        onClick={() => {
          Sentry.captureException(new Error('This is your first error!'), {
            tags: { source: 'manual-sentry-test' },
            level: 'error',
          });
        }}
      >
        Send Sentry Test Error
      </button>
    </div>
  );
}
