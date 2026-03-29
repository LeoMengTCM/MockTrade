import type { MarketDisplaySettings, PriceColorMode } from '@mocktrade/shared';
import { api } from './api';

export const DEFAULT_PRICE_COLOR_MODE: PriceColorMode = 'red-up-green-down';
export const PRICE_COLOR_MODE_STORAGE_KEY = 'mocktrade:price-color-mode';
export const PRICE_COLOR_MODE_EVENT = 'mocktrade:price-color-mode-change';

export function normalizePriceColorMode(mode?: string | null): PriceColorMode {
  return mode === 'green-up-red-down' ? 'green-up-red-down' : DEFAULT_PRICE_COLOR_MODE;
}

export function getCachedPriceColorMode(): PriceColorMode {
  if (typeof window === 'undefined') return DEFAULT_PRICE_COLOR_MODE;
  return normalizePriceColorMode(window.localStorage.getItem(PRICE_COLOR_MODE_STORAGE_KEY));
}

export function applyPriceColorMode(mode?: string | null): PriceColorMode {
  const normalized = normalizePriceColorMode(mode);
  if (typeof window === 'undefined') return normalized;

  document.documentElement.setAttribute('data-price-color-mode', normalized);
  window.localStorage.setItem(PRICE_COLOR_MODE_STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(PRICE_COLOR_MODE_EVENT, { detail: { mode: normalized } }));

  return normalized;
}

export async function syncPriceColorMode(): Promise<PriceColorMode> {
  const cached = getCachedPriceColorMode();
  applyPriceColorMode(cached);

  try {
    const response = await api.get<MarketDisplaySettings>('/market/display-settings');
    return applyPriceColorMode(response.data?.priceColorMode);
  } catch {
    return cached;
  }
}

export function getPricePalette() {
  if (typeof window === 'undefined') {
    return {
      up: '#E84142',
      down: '#00B96B',
      upSoft: 'rgba(232, 65, 66, 0.18)',
      downSoft: 'rgba(0, 185, 107, 0.18)',
    };
  }

  const styles = window.getComputedStyle(document.documentElement);
  return {
    up: styles.getPropertyValue('--price-up').trim() || '#E84142',
    down: styles.getPropertyValue('--price-down').trim() || '#00B96B',
    upSoft: styles.getPropertyValue('--price-up-soft').trim() || 'rgba(232, 65, 66, 0.18)',
    downSoft: styles.getPropertyValue('--price-down-soft').trim() || 'rgba(0, 185, 107, 0.18)',
  };
}
