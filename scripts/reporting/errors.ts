export class ReportingError extends Error {
  constructor(message: string, public readonly source: string) {
    super(message);
    this.name = 'ReportingError';
  }
}

export class MissingSecretError extends ReportingError {
  constructor(secretName: string) {
    super(`Missing required secret: ${secretName}`, 'bootstrap');
    this.name = 'MissingSecretError';
  }
}

export class SourceFetchError extends ReportingError {
  constructor(source: string, message: string) {
    super(message, source);
    this.name = 'SourceFetchError';
  }
}

export async function withTimeout<T>(
  source: string,
  factory: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      factory(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new SourceFetchError(source, `Timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withRetry<T>(
  source: string,
  factory: () => Promise<T>,
  retries = 2,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await factory();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delay = baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (lastError instanceof Error) {
    throw new SourceFetchError(source, lastError.message);
  }

  throw new SourceFetchError(source, 'Unknown retry failure');
}
