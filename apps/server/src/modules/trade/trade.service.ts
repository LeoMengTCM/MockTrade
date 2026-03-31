import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../entities/order.entity';
import { StockEntity } from '../../entities/stock.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { MarketStateService } from '../market/market-state.service';
import { MarketGateway } from '../market/market.gateway';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { AccountService } from './account.service';
import { PositionService } from './position.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { COMMISSION_RATE, MarketStatus, WsEvent } from '@mocktrade/shared';

@Injectable()
export class TradeService {
  private readonly logger = new Logger(TradeService.name);

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    @InjectRepository(SeasonEntity) private readonly seasonRepo: Repository<SeasonEntity>,
    private readonly marketState: MarketStateService,
    private readonly account: AccountService,
    private readonly position: PositionService,
    private readonly gateway: MarketGateway,
    private readonly leaderboard: LeaderboardService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Validate stock
    const stock = await this.stockRepo.findOne({ where: { id: dto.stockId, isActive: true } });
    if (!stock) throw new BadRequestException('股票不存在或已停用');

    // Get active season
    const season = await this.seasonRepo.findOne({ where: { isActive: true } });
    if (!season) throw new BadRequestException('当前没有活动赛季');

    // Market order requires market to be open
    if (dto.type === 'market' && this.marketState.getStatus() !== MarketStatus.OPENING) {
      throw new BadRequestException('当前休市中，仅支持限价单');
    }

    // Limit order requires price
    if (dto.type === 'limit' && !dto.price) {
      throw new BadRequestException('限价单必须指定价格');
    }

    const currentPrice = Number(stock.currentPrice);
    const price = dto.type === 'market' ? currentPrice : dto.price!;

    if (dto.side === 'buy') {
      return this.executeBuy(userId, season.id, stock, dto, price);
    } else {
      return this.executeSell(userId, season.id, stock, dto, price);
    }
  }

  private async executeBuy(userId: string, seasonId: string, stock: StockEntity, dto: CreateOrderDto, price: number) {
    const totalCost = +(price * dto.quantity).toFixed(2);
    const commission = +(totalCost * COMMISSION_RATE).toFixed(2);
    const totalWithCommission = +(totalCost + commission).toFixed(2);

    if (dto.type === 'market') {
      // Check funds and deduct immediately
      const ok = await this.account.deductCash(userId, seasonId, totalWithCommission);
      if (!ok) throw new BadRequestException('可用资金不足');

      // Create filled order
      const order = this.orderRepo.create({
        userId, stockId: stock.id, seasonId, type: 'market', side: 'buy',
        price: price as any, quantity: dto.quantity,
        filledPrice: price as any, filledQuantity: dto.quantity,
        status: 'filled', commission: commission as any, filledAt: new Date(),
      });
      await this.orderRepo.save(order);

      // Add position
      await this.position.addPosition(userId, stock.id, seasonId, dto.quantity, price);

      this.gateway.sendToUser(userId, WsEvent.ORDER_FILLED, { orderId: order.id, side: 'buy', ticker: stock.symbol, price, quantity: dto.quantity });
      this.logger.log(`BUY filled: ${stock.symbol} x${dto.quantity} @${price} for user=${userId}`);

      // Update leaderboard asynchronously
      this.updateLeaderboardForUser(userId, seasonId).catch(() => {});

      return order;
    } else {
      // Limit buy: freeze funds, create pending order
      const ok = await this.account.freezeCash(userId, seasonId, totalWithCommission);
      if (!ok) throw new BadRequestException('可用资金不足');

      const order = this.orderRepo.create({
        userId, stockId: stock.id, seasonId, type: 'limit', side: 'buy',
        price: dto.price as any, quantity: dto.quantity, status: 'pending',
        commission: commission as any,
      });
      await this.orderRepo.save(order);
      this.logger.log(`BUY limit pending: ${stock.symbol} x${dto.quantity} @${dto.price} for user=${userId}`);
      return order;
    }
  }

  private async executeSell(userId: string, seasonId: string, stock: StockEntity, dto: CreateOrderDto, price: number) {
    // Check position
    const hasPosition = await this.position.reducePosition(userId, stock.id, seasonId, dto.quantity);
    if (!hasPosition) throw new BadRequestException('持仓股数不足');

    if (dto.type === 'market') {
      const totalRevenue = +(price * dto.quantity).toFixed(2);
      const commission = +(totalRevenue * COMMISSION_RATE).toFixed(2);
      const netRevenue = +(totalRevenue - commission).toFixed(2);

      await this.account.addCash(userId, seasonId, netRevenue);

      const order = this.orderRepo.create({
        userId, stockId: stock.id, seasonId, type: 'market', side: 'sell',
        price: price as any, quantity: dto.quantity,
        filledPrice: price as any, filledQuantity: dto.quantity,
        status: 'filled', commission: commission as any, filledAt: new Date(),
      });
      await this.orderRepo.save(order);

      this.gateway.sendToUser(userId, WsEvent.ORDER_FILLED, { orderId: order.id, side: 'sell', ticker: stock.symbol, price, quantity: dto.quantity });
      this.logger.log(`SELL filled: ${stock.symbol} x${dto.quantity} @${price} for user=${userId}`);

      // Update leaderboard asynchronously
      this.updateLeaderboardForUser(userId, seasonId).catch(() => {});

      return order;
    } else {
      // Limit sell: position already reduced, create pending
      // If not filled, we need to restore position on cancel
      const totalRevenue = +(dto.price! * dto.quantity).toFixed(2);
      const commission = +(totalRevenue * COMMISSION_RATE).toFixed(2);

      const order = this.orderRepo.create({
        userId, stockId: stock.id, seasonId, type: 'limit', side: 'sell',
        price: dto.price as any, quantity: dto.quantity, status: 'pending',
        commission: commission as any,
      });
      await this.orderRepo.save(order);
      this.logger.log(`SELL limit pending: ${stock.symbol} x${dto.quantity} @${dto.price} for user=${userId}`);
      return order;
    }
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId, status: 'pending' } });
    if (!order) throw new BadRequestException('订单不存在或无法取消');

    order.status = 'cancelled';
    await this.orderRepo.save(order);

    if (order.side === 'buy') {
      // Unfreeze cash
      const totalCost = +(Number(order.price) * order.quantity * (1 + COMMISSION_RATE)).toFixed(2);
      await this.account.unfreezeCash(userId, order.seasonId, totalCost);
    } else {
      // Restore position
      await this.position.addPosition(userId, order.stockId, order.seasonId, order.quantity, Number(order.price));
    }

    this.gateway.sendToUser(userId, WsEvent.ORDER_CANCELLED, { orderId });
    return { message: 'Order cancelled' };
  }

  async getOrders(userId: string, status?: string, page = 1, limit = 20, stockId?: string) {
    const season = await this.seasonRepo.findOne({ where: { isActive: true } });
    if (!season) return { items: [], total: 0, page, limit };

    const qb = this.orderRepo.createQueryBuilder('o')
      .where('o.userId = :userId', { userId })
      .andWhere('o.seasonId = :seasonId', { seasonId: season.id })
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit).take(limit);
    if (status) qb.andWhere('o.status = :status', { status });
    if (stockId) qb.andWhere('o.stockId = :stockId', { stockId });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getActiveOrders(userId: string) {
    const season = await this.seasonRepo.findOne({ where: { isActive: true } });
    if (!season) return [];
    return this.orderRepo.find({
      where: { userId, seasonId: season.id, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Called by LimitOrderMatcher when a limit order is filled
   */
  async fillLimitOrder(order: OrderEntity, fillPrice: number): Promise<void> {
    const commission = +(fillPrice * order.quantity * COMMISSION_RATE).toFixed(2);

    if (order.side === 'buy') {
      const originalFrozen = +(Number(order.price) * order.quantity * (1 + COMMISSION_RATE)).toFixed(2);
      const actualCost = +(fillPrice * order.quantity + commission).toFixed(2);
      // Deduct from frozen, refund difference
      await this.account.deductFrozen(order.userId, order.seasonId, originalFrozen);
      if (actualCost < originalFrozen) {
        await this.account.addCash(order.userId, order.seasonId, +(originalFrozen - actualCost).toFixed(2));
      }
      await this.position.addPosition(order.userId, order.stockId, order.seasonId, order.quantity, fillPrice);
    } else {
      const netRevenue = +(fillPrice * order.quantity - commission).toFixed(2);
      await this.account.addCash(order.userId, order.seasonId, netRevenue);
    }

    order.filledPrice = fillPrice as any;
    order.filledQuantity = order.quantity;
    order.status = 'filled';
    order.commission = commission as any;
    order.filledAt = new Date();
    await this.orderRepo.save(order);

    const stock = await this.stockRepo.findOne({ where: { id: order.stockId } });
    this.gateway.sendToUser(order.userId, WsEvent.ORDER_FILLED, {
      orderId: order.id, side: order.side, ticker: stock?.symbol, price: fillPrice, quantity: order.quantity,
    });

    // Update leaderboard asynchronously
    this.updateLeaderboardForUser(order.userId, order.seasonId).catch(() => {});
  }

  private async updateLeaderboardForUser(userId: string, seasonId: string): Promise<void> {
    try {
      const account = await this.account.getAccount(userId, seasonId);
      const marketValue = await this.position.getTotalMarketValue(userId, seasonId);
      const totalAssets = +(account.availableCash + account.frozenCash + marketValue).toFixed(2);
      await this.leaderboard.updateAssets(seasonId, userId, totalAssets);
    } catch (e) {
      this.logger.warn(`Failed to update leaderboard for user=${userId}: ${e}`);
    }
  }
}
