import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MarketModule } from './modules/market/market.module';
import { AIModule } from './modules/ai/ai.module';
import { NewsModule } from './modules/news/news.module';
import { TradeModule } from './modules/trade/trade.module';
import { SeasonModule } from './modules/season/season.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { SocialModule } from './modules/social/social.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UserModule,
    MarketModule,
    AIModule,
    NewsModule,
    TradeModule,
    SeasonModule,
    LeaderboardModule,
    AchievementModule,
    SocialModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
