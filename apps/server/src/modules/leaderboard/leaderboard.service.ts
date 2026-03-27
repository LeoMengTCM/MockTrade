import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { RedisService } from '../redis/redis.service';

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
    private readonly redis: RedisService,
  ) {}

  private key(seasonId: string, type: string) { return `lb:${seasonId}:${type}`; }

  async updateScore(seasonId: string, type: string, userId: string, score: number): Promise<void> {
    await this.redis.zAdd(this.key(seasonId, type), score, userId);
  }

  async getTop(seasonId: string, type: string, limit = 100): Promise<LeaderboardEntry[]> {
    const items = await this.redis.zRevRangeWithScores(this.key(seasonId, type), 0, limit - 1);
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
    const returnRate = (totalAssets - 1000000) / 1000000;
    await this.updateScore(seasonId, 'return', userId, returnRate);
  }
}
