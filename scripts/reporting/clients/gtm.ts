import type { GtmMetrics, ReportWindow } from '../types';
import { SourceFetchError } from '../errors';
import { getGoogleAccessToken } from './google-auth';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SourceFetchError('gtm', `Missing env ${name}`);
  return value;
}

function parsePublishedLast24h(
  header:
    | {
        fingerprint?: string;
        updateTime?: string;
      }
    | undefined,
  window: ReportWindow
): boolean | null {
  if (!header) return null;

  const fromMs = Date.parse(window.fromUtc);
  const toMs = Date.parse(window.toUtc);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return null;

  const updateMs = header.updateTime ? Date.parse(header.updateTime) : Number.NaN;
  if (Number.isFinite(updateMs)) {
    return updateMs >= fromMs && updateMs <= toMs;
  }

  const fingerprintMs = Number(header.fingerprint);
  if (Number.isFinite(fingerprintMs) && fingerprintMs > 0) {
    return fingerprintMs >= fromMs && fingerprintMs <= toMs;
  }

  return null;
}

export async function fetchGtmMetrics(window: ReportWindow): Promise<GtmMetrics> {
  const accountId = required('GTM_ACCOUNT_ID');
  const containerId = required('GTM_CONTAINER_ID');
  const workspaceId = required('GTM_WORKSPACE_ID');

  const accessToken = await getGoogleAccessToken(
    ['https://www.googleapis.com/auth/tagmanager.readonly'],
    { serviceAccountRaw: process.env.GCP_SERVICE_ACCOUNT_JSON?.trim() }
  );

  const base = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}`;

  const versionHeadersResponse = await fetch(`${base}/version_headers`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!versionHeadersResponse.ok) {
    const body = await versionHeadersResponse.text();
    throw new SourceFetchError(
      'gtm',
      `Version headers API failed (${versionHeadersResponse.status}) for account=${accountId}, container=${containerId}. ${body.slice(0, 200)}`
    );
  }

  const versionHeaders = (await versionHeadersResponse.json()) as {
    containerVersionHeader?: Array<{
      num?: string;
      containerVersionId?: string;
      deleted?: boolean;
      name?: string;
      latest?: boolean;
      updateTime?: string;
      fingerprint?: string;
      container?: { publicId?: string };
    }>;
  };
  const headers = versionHeaders.containerVersionHeader ?? [];
  const latestHeader =
    headers.find((header) => header.latest) ??
    [...headers].sort((a, b) => Number(b.containerVersionId ?? 0) - Number(a.containerVersionId ?? 0))[0];
  const liveVersion = latestHeader?.containerVersionId ?? 'Unknown';

  const statusResponse = await fetch(`${base}/workspaces/${workspaceId}/status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let pendingChanges = 0;
  if (statusResponse.ok) {
    const statusJson = (await statusResponse.json()) as { workspaceChange?: unknown[] };
    pendingChanges = statusJson.workspaceChange?.length ?? 0;
  }

  // GTM metadata fields vary by account/type. We return null (Unknown) when
  // no reliable timestamp/fingerprint is present instead of forcing "No".
  const publishedLast24h = parsePublishedLast24h(latestHeader, window);

  return {
    liveContainerVersion: String(liveVersion),
    publishedLast24h,
    pendingChanges,
  };
}
