import { Injectable } from '@nestjs/common';
import type { MarketDisplaySettings, PriceColorMode } from '@mocktrade/shared';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DisplaySettingsService {
  private readonly SETTINGS_KEY = 'config:market:display';
  private readonly DEFAULT_PRICE_COLOR_MODE: PriceColorMode = 'red-up-green-down';

  constructor(private readonly redis: RedisService) {}

  async getSettings(): Promise<MarketDisplaySettings> {
    const storedMode = await this.redis.hGet(this.SETTINGS_KEY, 'priceColorMode');
    return {
      priceColorMode: this.normalizePriceColorMode(storedMode),
    };
  }

  async saveSettings(input: Partial<MarketDisplaySettings>): Promise<MarketDisplaySettings> {
    const settings = {
      priceColorMode: this.normalizePriceColorMode(input.priceColorMode),
    };

    await this.redis.hSet(this.SETTINGS_KEY, 'priceColorMode', settings.priceColorMode);
    return settings;
  }

  private normalizePriceColorMode(mode?: string | null): PriceColorMode {
    return mode === 'green-up-red-down'
      ? 'green-up-red-down'
      : this.DEFAULT_PRICE_COLOR_MODE;
  }
}
