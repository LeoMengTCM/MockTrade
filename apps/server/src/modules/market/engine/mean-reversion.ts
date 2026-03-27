import { Injectable } from '@nestjs/common';

@Injectable()
export class MeanReversion {
  calculate(currentPrice: number, basePrice: number, kappa = 0.02): number {
    const deviation = (currentPrice - basePrice) / basePrice;
    const absDeviation = Math.abs(deviation);
    let effectiveKappa = kappa;
    if (absDeviation > 0.8) effectiveKappa = kappa * 5;
    else if (absDeviation > 0.5) effectiveKappa = kappa * 3;
    else if (absDeviation > 0.3) effectiveKappa = kappa * 1.5;
    return +(currentPrice * -effectiveKappa * deviation).toFixed(4);
  }
}
