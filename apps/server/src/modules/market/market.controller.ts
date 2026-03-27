import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { MarketStateService } from './market-state.service';
import { KLineService } from './kline.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('market')
export class MarketController {
  constructor(
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    private readonly marketState: MarketStateService,
    private readonly klineService: KLineService,
  ) {}

  @Public()
  @Get('status')
  getStatus() {
    return {
      status: this.marketState.getStatus(),
      cycleCount: this.marketState.getCycleCount(),
      openDuration: this.marketState.getOpenDuration(),
      closeDuration: this.marketState.getCloseDuration(),
    };
  }

  @Public()
  @Get('stocks')
  async getStocks() {
    const stocks = await this.stockRepo.find({ where: { isActive: true }, order: { symbol: 'ASC' } });
    return stocks.map((s) => ({
      id: s.id, symbol: s.symbol, name: s.name, persona: s.persona, sector: s.sector,
      currentPrice: Number(s.currentPrice), openPrice: Number(s.openPrice),
      prevClosePrice: Number(s.prevClosePrice), dailyHigh: Number(s.dailyHigh),
      dailyLow: Number(s.dailyLow), volume: Number(s.volume),
      changePercent: Number(s.openPrice) > 0 ? (Number(s.currentPrice) - Number(s.openPrice)) / Number(s.openPrice) : 0,
    }));
  }

  @Public()
  @Get('stocks/:id')
  async getStockDetail(@Param('id') id: string) {
    const s = await this.stockRepo.findOne({ where: { id } });
    if (!s) return { error: 'Stock not found' };
    return {
      id: s.id, symbol: s.symbol, name: s.name, persona: s.persona, sector: s.sector,
      basePrice: Number(s.basePrice), currentPrice: Number(s.currentPrice),
      openPrice: Number(s.openPrice), prevClosePrice: Number(s.prevClosePrice),
      dailyHigh: Number(s.dailyHigh), dailyLow: Number(s.dailyLow), volume: Number(s.volume),
    };
  }

  @Public()
  @Get('stocks/:id/kline')
  async getKLine(@Param('id') id: string, @Query('periods') periods?: string) {
    return this.klineService.getKLines(id, periods ? parseInt(periods) : 100);
  }
}
