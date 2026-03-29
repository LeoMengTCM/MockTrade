function getAssetBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^[a-z]+:/i.test(url)) return url;

  const baseUrl = getAssetBaseUrl();
  if (!baseUrl) return url;

  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}
