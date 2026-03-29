const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^[a-z]+:/i.test(url)) return url;

  try {
    return new URL(url, API_BASE_URL).toString();
  } catch {
    return url;
  }
}
