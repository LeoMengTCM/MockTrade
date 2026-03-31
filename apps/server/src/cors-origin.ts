const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function isLocalhostHostname(hostname: string) {
  return LOCALHOST_HOSTNAMES.has(hostname);
}

function parseConfiguredOrigins(configured?: string): string[] {
  const source = configured?.trim() ? configured : 'http://localhost';
  return source
    .split(',')
    .map((value) => stripTrailingSlash(value.trim()))
    .filter(Boolean);
}

export function createCorsOriginMatcher(configured?: string) {
  const configuredOrigins = parseConfiguredOrigins(configured);
  const exactOrigins = new Set<string>();
  const localhostProtocols = new Set<string>();

  for (const origin of configuredOrigins) {
    exactOrigins.add(origin);

    try {
      const parsed = new URL(origin);
      if (isLocalhostHostname(parsed.hostname) && !parsed.port) {
        localhostProtocols.add(parsed.protocol);
      }
    } catch {
      // Keep invalid entries as exact-match only.
    }
  }

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = stripTrailingSlash(origin);
    if (exactOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    try {
      const parsed = new URL(normalizedOrigin);
      if (isLocalhostHostname(parsed.hostname) && localhostProtocols.has(parsed.protocol)) {
        callback(null, true);
        return;
      }
    } catch {
      // Fall through to rejection.
    }

    callback(new Error(`Not allowed by CORS: ${origin}`), false);
  };
}

