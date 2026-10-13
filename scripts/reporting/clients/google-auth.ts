import { createSign } from 'node:crypto';
import { SourceFetchError } from '../errors';

interface ServiceAccountJson {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function parseServiceAccount(raw: string): ServiceAccountJson {
  try {
    const parsed = JSON.parse(raw) as ServiceAccountJson;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('Missing client_email/private_key');
    }
    return parsed;
  } catch (error) {
    throw new SourceFetchError('google-auth', `Invalid service account JSON: ${error instanceof Error ? error.message : 'unknown'}`);
  }
}

function readOAuthSecrets():
  | { clientId: string; clientSecret: string; refreshToken: string }
  | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  if (!clientId && !clientSecret && !refreshToken) {
    return null;
  }

  if (!clientId || !clientSecret || !refreshToken) {
    throw new SourceFetchError(
      'google-auth',
      'OAuth auth is partially configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN.'
    );
  }

  return { clientId, clientSecret, refreshToken };
}

async function getGoogleAccessTokenFromOAuth(): Promise<string> {
  const oauth = readOAuthSecrets();
  if (!oauth) {
    throw new SourceFetchError('google-auth', 'OAuth secrets are not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      refresh_token: oauth.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new SourceFetchError(
      'google-auth',
      `OAuth refresh token exchange failed (${response.status}): ${body.slice(0, 200)}`
    );
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new SourceFetchError('google-auth', 'No access token returned from OAuth refresh exchange');
  }

  return json.access_token;
}

async function getGoogleAccessTokenFromServiceAccount(
  scope: string[],
  serviceAccountRaw: string
): Promise<string> {
  const serviceAccount = parseServiceAccount(serviceAccountRaw);
  const tokenUri = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: serviceAccount.client_email,
    scope: scope.join(' '),
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaims = base64UrlEncode(JSON.stringify(claims));
  const unsigned = `${encodedHeader}.${encodedClaims}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = signer.sign(serviceAccount.private_key, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new SourceFetchError('google-auth', `Token exchange failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new SourceFetchError('google-auth', 'No access token returned by Google OAuth endpoint');
  }

  return json.access_token;
}

export async function getGoogleAccessToken(
  scope: string[],
  options: { serviceAccountRaw?: string } = {}
): Promise<string> {
  const oauth = readOAuthSecrets();
  if (oauth) {
    return getGoogleAccessTokenFromOAuth();
  }

  if (!options.serviceAccountRaw) {
    throw new SourceFetchError(
      'google-auth',
      'Google auth is not configured. Set OAuth secrets or provide service account JSON.'
    );
  }

  return getGoogleAccessTokenFromServiceAccount(scope, options.serviceAccountRaw);
}
