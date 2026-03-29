import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { PositionEntity } from '../../entities/position.entity';
import { StockEntity } from '../../entities/stock.entity';
import { RedisService } from '../redis/redis.service';
import { INITIAL_CAPITAL } from '@mocktrade/shared';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PositionEntity) private readonly positionRepo: Repository<PositionEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    private readonly redis: RedisService,
  ) {}

  private key(seasonId: string, type: string) { return `lb:${seasonId}:${type}`; }

  async updateScore(seasonId: string, type: string, userId: string, score: number): Promise<void> {
    await this.redis.zAdd(this.key(seasonId, type), score, userId);
  }

  async getTop(seasonId: string, type: string, limit = 100, order: 'desc' | 'asc' = 'desc'): Promise<LeaderboardEntry[]> {
    const items = order === 'desc'
      ? await this.redis.zRevRangeWithScores(this.key(seasonId, type), 0, limit - 1)
      : await this.redis.zRangeWithScores(this.key(seasonId, type), 0, limit - 1);
      
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const user = await this.userRepo.findOne({ where: { id: items[i].member } });
      entries.push({
        rank: i + 1,
        userId: items[i].member,
        username: user?.username || 'Unknown',
        avatarUrl: user?.avatarUrl || '',
        score: items[i].score,
      });
    }
    return entries;
  }

  async getMyRank(seasonId: string, type: string, userId: string): Promise<{ rank: number | null; score: number }> {
    const rank = await this.redis.zRevRank(this.key(seasonId, type), userId);
    const items = await this.redis.zRevRangeWithScores(this.key(seasonId, type), 0, -1);
    const entry = items.find(i => i.member === userId);
    return { rank: rank !== null ? rank + 1 : null, score: entry?.score || 0 };
  }

  async updateAssets(seasonId: string, userId: string, totalAssets: number): Promise<void> {
    await this.updateScore(seasonId, 'assets', userId, totalAssets);
    const returnRate = (totalAssets - INITIAL_CAPITAL) / INITIAL_CAPITAL;
    await this.updateScore(seasonId, 'return', userId, returnRate);
  }

  async refreshSeasonLeaderboard(seasonId: string): Promise<void> {
    const users = await this.userRepo.find();
    const positions = await this.positionRepo.find({ where: { seasonId } });
    const stocks = await this.stockRepo.find();

    const stockPriceMap = new Map(stocks.map((stock) => [stock.id, Number(stock.currentPrice)]));
    const positionsByUser = new Map<string, PositionEntity[]>();

    for (const position of positions) {
      const userPositions = positionsByUser.get(position.userId) || [];
      userPositions.push(position);
      positionsByUser.set(position.userId, userPositions);
    }

    for (const user of users) {
      const accountRaw = await this.redis.get(`account:${user.id}:${seasonId}`);
      const account = accountRaw
        ? JSON.parse(accountRaw) as { availableCash: number; frozenCash: number }
        : { availableCash: INITIAL_CAPITAL, frozenCash: 0 };

      const marketValue = (positionsByUser.get(user.id) || []).reduce((sum, position) => {
        if (position.quantity <= 0) return sum;
        return sum + position.quantity * (stockPriceMap.get(position.stockId) || 0);
      }, 0);

      const totalAssets = +(Number(account.availableCash) + Number(account.frozenCash) + marketValue).toFixed(2);
      await this.updateAssets(seasonId, user.id, totalAssets);
    }

    this.logger.debug(`Leaderboard refreshed for season=${seasonId}`);
  }
}
