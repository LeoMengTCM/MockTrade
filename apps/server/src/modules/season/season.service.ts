import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeasonEntity } from '../../entities/season.entity';
import { SeasonRecordEntity } from '../../entities/season-record.entity';
import { UserEntity } from '../../entities/user.entity';
import { PositionEntity } from '../../entities/position.entity';
import { StockEntity } from '../../entities/stock.entity';
import { RedisService } from '../redis/redis.service';
import { INITIAL_CAPITAL, getTierFromReturnRate } from '@mocktrade/shared';

@Injectable()
export class SeasonService {
  private readonly logger = new Logger(SeasonService.name);

  constructor(
    @InjectRepository(SeasonEntity) private readonly seasonRepo: Repository<SeasonEntity>,
    @InjectRepository(SeasonRecordEntity) private readonly recordRepo: Repository<SeasonRecordEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PositionEntity) private readonly posRepo: Repository<PositionEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    private readonly redis: RedisService,
  ) {}

  async getActiveSeason(): Promise<SeasonEntity | null> {
    return this.seasonRepo.findOne({ where: { isActive: true } });
  }

  async createSeason(name: string, startDate: Date, endDate: Date): Promise<SeasonEntity> {
    // Deactivate current active season
    const current = await this.getActiveSeason();
    if (current) {
      current.isActive = false;
      await this.seasonRepo.save(current);
    }

    const season = this.seasonRepo.create({ name, startDate, endDate, isActive: true });
    await this.seasonRepo.save(season);

    // Initialize accounts for all users
    const users = await this.userRepo.find();
    for (const user of users) {
      await this.redis.set(
        `account:${user.id}:${season.id}`,
        JSON.stringify({ availableCash: INITIAL_CAPITAL, frozenCash: 0 }),
      );
    }

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

    this.logger.log(`Season created: ${name} (${startDate.toISOString()} - ${endDate.toISOString()})`);
    return season;
  }

  async endSeason(seasonId: string): Promise<void> {
    const season = await this.seasonRepo.findOne({ where: { id: seasonId } });
    if (!season) throw new BadRequestException('Season not found');

    season.isActive = false;
    await this.seasonRepo.save(season);

    // Calculate final assets for all users
    const users = await this.userRepo.find();
    const records: SeasonRecordEntity[] = [];

    for (const user of users) {
      const accountRaw = await this.redis.get(`account:${user.id}:${seasonId}`);
      const account = accountRaw ? JSON.parse(accountRaw) : { availableCash: INITIAL_CAPITAL, frozenCash: 0 };

      // Calculate market value of all positions
      const positions = await this.posRepo.find({ where: { userId: user.id, seasonId } });
      let marketValue = 0;
      for (const pos of positions) {
        if (pos.quantity <= 0) continue;
        const stock = await this.stockRepo.findOne({ where: { id: pos.stockId } });
        if (stock) marketValue += pos.quantity * Number(stock.currentPrice);
      }

      const totalAssets = +(account.availableCash + account.frozenCash + marketValue).toFixed(2);
      const returnRate = +((totalAssets - INITIAL_CAPITAL) / INITIAL_CAPITAL).toFixed(6);
      const tier = getTierFromReturnRate(returnRate);

      records.push(this.recordRepo.create({
        userId: user.id, seasonId, finalAssets: totalAssets as any,
        returnRate: returnRate as any, tier, ranking: 0,
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
}
