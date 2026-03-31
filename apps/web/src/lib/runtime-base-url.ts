const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const LOCALHOST_PORT_FALLBACKS: Record<string, string> = {
  '3000': '3001',
  '9510': '9511',
};

function isLocalhostHostname(hostname: string) {
  return LOCALHOST_HOSTNAMES.has(hostname);
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function resolveLocalhostPlaceholder(currentOrigin: string): string {
  try {
    const currentUrl = new URL(currentOrigin);
    const mappedPort = LOCALHOST_PORT_FALLBACKS[currentUrl.port];
    if (mappedPort && isLocalhostHostname(currentUrl.hostname)) {
      currentUrl.port = mappedPort;
      return currentUrl.origin;
    }
    return currentUrl.origin;
  } catch {
    return currentOrigin;
  }
}

function normalizeConfiguredBaseUrl(configured: string | undefined, currentOrigin?: string): string {
  const trimmed = configured?.trim();
  if (!trimmed) return '';

  const normalized = stripTrailingSlash(trimmed);
  if (!currentOrigin) return normalized;

  try {
    const configuredUrl = new URL(normalized);
    if (isLocalhostHostname(configuredUrl.hostname) && !configuredUrl.port) {
      return resolveLocalhostPlaceholder(currentOrigin);
    }
  } catch {
    return normalized;
  }

  return normalized;
}

export function resolveRuntimeBaseUrl(configured: string | undefined, serverFallback: string): string {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
  const resolved = normalizeConfiguredBaseUrl(configured, currentOrigin);
  if (resolved) return resolved;
  if (currentOrigin) return currentOrigin;
  return serverFallback;
}

