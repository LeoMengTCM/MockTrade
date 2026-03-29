import { IsIn } from 'class-validator';
import type { PriceColorMode } from '@mocktrade/shared';

export class UpdateDisplaySettingsDto {
  @IsIn(['red-up-green-down', 'green-up-red-down'])
  priceColorMode: PriceColorMode;
}
