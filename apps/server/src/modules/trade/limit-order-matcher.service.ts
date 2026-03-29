import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../entities/order.entity';
import { StockEntity } from '../../entities/stock.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { MarketStateService } from '../market/market-state.service';
import { TradeService } from './trade.service';
import { MarketStatus } from '@mocktrade/shared';

@Injectable()
export class LimitOrderMatcher implements OnModuleInit {
  private readonly logger = new Logger(LimitOrderMatcher.name);
  private matchTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    @InjectRepository(SeasonEntity) private readonly seasonRepo: Repository<SeasonEntity>,
    private readonly marketState: MarketStateService,
    private readonly tradeService: TradeService,
  ) {}

  onModuleInit() {
    this.marketState.onStatusChange((status) => {
      if (status === MarketStatus.OPENING) this.startMatching();
      else this.stopMatching();
    });
  }

  private startMatching() {
    this.matchTimer = setInterval(() => this.matchAll(), 3000); // check every 3s
  }

  private stopMatching() {
    if (this.matchTimer) { clearInterval(this.matchTimer); this.matchTimer = null; }
  }

  private async matchAll() {
    if (this.marketState.getStatus() !== MarketStatus.OPENING) return;

    const season = await this.seasonRepo.findOne({ where: { isActive: true } });
    if (!season) return;

    const pendingOrders = await this.orderRepo.find({
      where: { status: 'pending', type: 'limit', seasonId: season.id },
    });
    if (pendingOrders.length === 0) return;

    // Group by stock for efficiency
    const stockIds = [...new Set(pendingOrders.map(o => o.stockId))];
    const stocks = await this.stockRepo.findByIds(stockIds);
    const stockMap = new Map(stocks.map(s => [s.id, s]));

    for (const order of pendingOrders) {
      const stock = stockMap.get(order.stockId);
      if (!stock) continue;
      const currentPrice = Number(stock.currentPrice);

      let shouldFill = false;
      if (order.side === 'buy' && currentPrice <= Number(order.price)) {
        shouldFill = true;
      } else if (order.side === 'sell' && currentPrice >= Number(order.price)) {
        shouldFill = true;
      }

      if (shouldFill) {
        try {
          await this.tradeService.fillLimitOrder(order, currentPrice);
          this.logger.log(`Limit ${order.side} filled: ${stock.symbol} x${order.quantity} @${currentPrice}`);
        } catch (e) {
          this.logger.error(`Failed to fill limit order ${order.id}`, e);
        }
      }
    }
  }
}
