import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StockEntity } from '../../entities/stock.entity';
import { StockTickEntity } from '../../entities/stock-tick.entity';
import { MarketStateService } from './market-state.service';
import { PriceSynthesizer } from './engine/price-synthesizer';
import { RandomWalk } from './engine/random-walk';
import { MeanReversion } from './engine/mean-reversion';
import { EventImpact } from './engine/event-impact';
import { TickScheduler } from './engine/tick-scheduler';
import { KLineService } from './kline.service';
import { MarketController } from './market.controller';
import { MarketGateway } from './market.gateway';
import { DisplaySettingsService } from './display-settings.service';
import { ManualPriceInterventionService } from './manual-price-intervention.service';
import { TrendEngine } from './engine/trend-engine';
import { MarketRegimeService } from './market-regime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockEntity, StockTickEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [MarketController],
  providers: [
    MarketStateService,
    PriceSynthesizer,
    RandomWalk,
    MeanReversion,
    EventImpact,
    TrendEngine,
    TickScheduler,
    KLineService,
    MarketGateway,
    DisplaySettingsService,
    ManualPriceInterventionService,
    MarketRegimeService,
  ],
  exports: [MarketStateService, EventImpact, KLineService, MarketGateway, DisplaySettingsService, ManualPriceInterventionService, MarketRegimeService],
})
export class MarketModule {}
