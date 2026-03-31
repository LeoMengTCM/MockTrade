import { resolveRuntimeBaseUrl } from './runtime-base-url';

function getAssetBaseUrl() {
  return resolveRuntimeBaseUrl(process.env.NEXT_PUBLIC_API_URL, '');
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
