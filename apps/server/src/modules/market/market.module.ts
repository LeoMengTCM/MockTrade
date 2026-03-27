import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [TypeOrmModule.forFeature([StockEntity, StockTickEntity])],
  controllers: [MarketController],
  providers: [
    MarketStateService,
    PriceSynthesizer,
    RandomWalk,
    MeanReversion,
    EventImpact,
    TickScheduler,
    KLineService,
    MarketGateway,
  ],
  exports: [MarketStateService, EventImpact, KLineService, MarketGateway],
})
export class MarketModule {}
