import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementEntity } from '../../entities/achievement.entity';
import { UserAchievementEntity } from '../../entities/user-achievement.entity';
import { OrderEntity } from '../../entities/order.entity';
import { MarketGateway } from '../market/market.gateway';
import { WsEvent } from '@mocktrade/shared';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectRepository(AchievementEntity) private readonly achievementRepo: Repository<AchievementEntity>,
    @InjectRepository(UserAchievementEntity) private readonly userAchRepo: Repository<UserAchievementEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    private readonly gateway: MarketGateway,
  ) {}

  async getAll(userId?: string) {
    const achievements = await this.achievementRepo.find();
    if (!userId) return achievements.map(a => ({ ...a, isEarned: false, earnedAt: null }));

    const earned = await this.userAchRepo.find({ where: { userId } });
    const earnedMap = new Map(earned.map(e => [e.achievementId, e.unlockedAt]));

    return achievements.map(a => ({
      ...a,
      isEarned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) || null,
    }));
  }

  async getUserAchievements(userId: string) {
    return this.userAchRepo.find({ where: { userId } });
  }

  async checkAndUnlock(userId: string): Promise<void> {
    const achievements = await this.achievementRepo.find();
    const earned = await this.userAchRepo.find({ where: { userId } });
    const earnedCodes = new Set(earned.map(e => e.achievementId));

    for (const ach of achievements) {
      if (earnedCodes.has(ach.id)) continue;
      const unlocked = await this.checkCondition(userId, ach);
      if (unlocked) {
        await this.unlock(userId, ach);
      }
    }
  }

  private async checkCondition(userId: string, achievement: AchievementEntity): Promise<boolean> {
    const code = achievement.code;
    const orders = await this.orderRepo.find({ where: { userId, status: 'filled' } });

    switch (code) {
      case 'first_trade':
        return orders.length >= 1;
      case 'ten_trades':
        return orders.length >= 10;
      case 'fifty_trades':
        return orders.length >= 50;
      case 'winning_streak_5': {
        const sells = orders.filter(o => o.side === 'sell').slice(-5);
        if (sells.length < 5) return false;
        return sells.every(o => Number(o.filledPrice) > Number(o.price));
      }
      case 'big_spender': {
        return orders.some(o => o.side === 'buy' && Number(o.filledPrice) * (o.filledQuantity || 0) > 500000);
      }
      case 'diversified': {
        const uniqueStocks = new Set(orders.filter(o => o.side === 'buy').map(o => o.stockId));
        return uniqueStocks.size >= 10;
      }
      default:
        return false;
    }
  }

  private async unlock(userId: string, achievement: AchievementEntity): Promise<void> {
    const exists = await this.userAchRepo.findOne({ where: { userId, achievementId: achievement.id } });
    if (exists) return;

    const ua = this.userAchRepo.create({ userId, achievementId: achievement.id });
    await this.userAchRepo.save(ua);

    this.gateway.sendToUser(userId, WsEvent.ACHIEVEMENT_UNLOCKED, {
      code: achievement.code, name: achievement.name, rarity: achievement.rarity,
    });
    this.logger.log(`Achievement unlocked: ${achievement.name} for user=${userId}`);
  }

  async seedAchievements(): Promise<void> {
    const seeds = [
      { code: 'first_trade', name: '初来乍到', description: '完成第一笔交易', rarity: 'common' as const },
      { code: 'ten_trades', name: '小试牛刀', description: '完成10笔交易', rarity: 'common' as const },
      { code: 'fifty_trades', name: '交易达人', description: '完成50笔交易', rarity: 'rare' as const },
      { code: 'winning_streak_5', name: '连胜将军', description: '连续5笔盈利交易', rarity: 'rare' as const },
      { code: 'big_spender', name: '全仓梭哈', description: '单笔交易超过50万', rarity: 'epic' as const },
      { code: 'diversified', name: '分散投资', description: '交易过10只不同股票', rarity: 'rare' as const },
      { code: 'diamond_hands', name: '钻石手', description: '持有股票经历20%回撤不卖出', rarity: 'epic' as const },
      { code: 'legendary_tier', name: '传奇玩家', description: '赛季段位达到传奇', rarity: 'legendary' as const },
      { code: 'news_trader', name: '新闻嗅觉', description: '在新闻发布后10秒内交易', rarity: 'epic' as const },
      { code: 'social_star', name: '社交达人', description: '获得10个关注者', rarity: 'rare' as const },
    ];

    for (const seed of seeds) {
      const exists = await this.achievementRepo.findOne({ where: { code: seed.code } });
      if (!exists) {
        await this.achievementRepo.save(this.achievementRepo.create(seed));
      }
    }
    this.logger.log(`Seeded ${seeds.length} achievements`);
  }
}
