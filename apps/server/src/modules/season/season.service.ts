import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeasonEntity } from '../../entities/season.entity';
import { SeasonRecordEntity } from '../../entities/season-record.entity';
import { UserEntity } from '../../entities/user.entity';
import { PositionEntity } from '../../entities/position.entity';
import { StockEntity } from '../../entities/stock.entity';
import { OrderEntity } from '../../entities/order.entity';
import { RedisService } from '../redis/redis.service';
import { COMMISSION_RATE, INITIAL_CAPITAL, getTierFromReturnRate } from '@mocktrade/shared';

@Injectable()
export class SeasonService implements OnModuleInit {
  private readonly logger = new Logger(SeasonService.name);

  constructor(
    @InjectRepository(SeasonEntity) private readonly seasonRepo: Repository<SeasonEntity>,
    @InjectRepository(SeasonRecordEntity) private readonly recordRepo: Repository<SeasonRecordEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PositionEntity) private readonly posRepo: Repository<PositionEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    await this.ensureActiveSeasonExists();
  }

  async getActiveSeason(): Promise<SeasonEntity | null> {
    return this.seasonRepo.findOne({ where: { isActive: true } });
  }

  async ensureActiveSeasonExists(): Promise<SeasonEntity> {
    const activeSeason = await this.getActiveSeason();
    if (activeSeason) return activeSeason;

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const season = await this.createSeason(
      `${now.getFullYear()}年${now.getMonth() + 1}月赛季`,
      now,
      endDate,
    );
    this.logger.log(`Auto-created default active season: ${season.name}`);
    return season;
  }

  async createSeason(name: string, startDate: Date, endDate: Date): Promise<SeasonEntity> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException('赛季名称不能为空');
    }

    this.validateSeasonDates(startDate, endDate);

    const current = await this.getActiveSeason();
    if (current) {
      await this.endSeason(current.id);
    }

    const season = this.seasonRepo.create({
      name: trimmedName,
      startDate,
      endDate,
      isActive: true,
    });
    await this.seasonRepo.save(season);

    // Initialize accounts for all users
    const users = await this.userRepo.find();
    await Promise.all(users.map((user) => this.redis.set(
      `account:${user.id}:${season.id}`,
      JSON.stringify({ availableCash: INITIAL_CAPITAL, frozenCash: 0 }),
    )));

    // Reset stock prices to base prices
    const stocks = await this.stockRepo.find({ where: { isActive: true } });
    for (const stock of stocks) {
      stock.currentPrice = stock.basePrice;
      stock.openPrice = stock.basePrice;
      stock.prevClosePrice = stock.basePrice;
      stock.dailyHigh = stock.basePrice;
      stock.dailyLow = stock.basePrice;
      stock.volume = 0 as any;
    }
    await this.stockRepo.save(stocks);

    this.logger.log(`Season created: ${trimmedName} (${startDate.toISOString()} - ${endDate.toISOString()})`);
    return season;
  }

  async endSeason(seasonId: string): Promise<void> {
    const season = await this.seasonRepo.findOne({ where: { id: seasonId } });
    if (!season) {
      throw new BadRequestException('赛季不存在');
    }

    await this.expirePendingOrders(seasonId);

    if (season.isActive) {
      season.isActive = false;
      await this.seasonRepo.save(season);
    }

    await this.recordRepo.delete({ seasonId });

    // Calculate final assets for all users
    const users = await this.userRepo.find();
    const positions = await this.posRepo.find({ where: { seasonId } });
    const stocks = await this.stockRepo.find();
    const stockPriceMap = new Map(stocks.map((stock) => [stock.id, Number(stock.currentPrice)]));
    const positionsByUser = new Map<string, PositionEntity[]>();
    for (const position of positions) {
      const userPositions = positionsByUser.get(position.userId) || [];
      userPositions.push(position);
      positionsByUser.set(position.userId, userPositions);
    }

    const records: SeasonRecordEntity[] = [];

    for (const user of users) {
      const account = await this.getSeasonAccount(user.id, seasonId);
      const userPositions = positionsByUser.get(user.id) || [];
      const marketValue = userPositions.reduce((sum, position) => {
        if (position.quantity <= 0) return sum;
        return sum + position.quantity * (stockPriceMap.get(position.stockId) || 0);
      }, 0);

      const totalAssets = +(account.availableCash + account.frozenCash + marketValue).toFixed(2);
      const returnRate = +((totalAssets - INITIAL_CAPITAL) / INITIAL_CAPITAL).toFixed(6);
      const tier = getTierFromReturnRate(returnRate);

      records.push(this.recordRepo.create({
        userId: user.id,
        seasonId,
        finalAssets: totalAssets as any,
        returnRate: returnRate as any,
        tier,
        ranking: 0,
      }));
    }

    // Sort by finalAssets descending for ranking
    records.sort((a, b) => Number(b.finalAssets) - Number(a.finalAssets));
    records.forEach((r, i) => { r.ranking = i + 1; });

    await this.recordRepo.save(records);
    this.logger.log(`Season ${season.name} ended. ${records.length} records created.`);
  }

  async getSeasons() {
    return this.seasonRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getSeasonResults(seasonId: string) {
    return this.recordRepo.find({
      where: { seasonId },
      order: { ranking: 'ASC' },
    });
  }

  async getUserSeasonHistory(userId: string) {
    return this.recordRepo.find({
      where: { userId },
      order: { seasonId: 'DESC' },
    });
  }

  private validateSeasonDates(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('请输入完整的开始和结束时间');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }
  }

  private async getSeasonAccount(userId: string, seasonId: string) {
    const accountRaw = await this.redis.get(`account:${userId}:${seasonId}`);
    if (!accountRaw) {
      return { availableCash: INITIAL_CAPITAL, frozenCash: 0 };
    }

    const parsed = JSON.parse(accountRaw) as { availableCash: number; frozenCash: number };
    return {
      availableCash: Number(parsed.availableCash) || 0,
      frozenCash: Number(parsed.frozenCash) || 0,
    };
  }

  private async expirePendingOrders(seasonId: string) {
    const pendingOrders = await this.orderRepo.find({ where: { seasonId, status: 'pending' } });
    if (pendingOrders.length === 0) {
      return;
    }

    const accountCache = new Map<string, { availableCash: number; frozenCash: number }>();
    const positionCache = new Map<string, PositionEntity | null>();

    for (const order of pendingOrders) {
      if (order.side === 'buy') {
        const accountKey = `${order.userId}:${seasonId}`;
        let account = accountCache.get(accountKey);
        if (!account) {
          account = await this.getSeasonAccount(order.userId, seasonId);
          accountCache.set(accountKey, account);
        }

        const frozenAmount = +(Number(order.price) * order.quantity * (1 + COMMISSION_RATE)).toFixed(2);
        account.frozenCash = Math.max(0, +(account.frozenCash - frozenAmount).toFixed(2));
        account.availableCash = +(account.availableCash + frozenAmount).toFixed(2);
      } else {
        const positionKey = `${order.userId}:${order.stockId}:${seasonId}`;
        let position = positionCache.get(positionKey);
        if (position === undefined) {
          position = await this.posRepo.findOne({
            where: {
              userId: order.userId,
              stockId: order.stockId,
              seasonId,
            },
          });
          positionCache.set(positionKey, position ?? null);
        }

        if (position) {
          position.quantity += order.quantity;
        } else {
          position = this.posRepo.create({
            userId: order.userId,
            stockId: order.stockId,
            seasonId,
            quantity: order.quantity,
            avgCost: order.price as any,
          });
          positionCache.set(positionKey, position);
        }
      }

      order.status = 'expired';
    }

    await Promise.all(Array.from(accountCache.entries()).map(([cacheKey, account]) => {
      const [userId] = cacheKey.split(':');
      return this.redis.set(
        `account:${userId}:${seasonId}`,
        JSON.stringify(account),
      );
    }));

    const positionsToSave = Array.from(positionCache.values()).filter((position): position is PositionEntity => !!position);
    if (positionsToSave.length > 0) {
      await this.posRepo.save(positionsToSave);
    }

    await this.orderRepo.save(pendingOrders);
    this.logger.log(`Expired ${pendingOrders.length} pending orders for season=${seasonId}`);
  }
}
