import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
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
import { UploadModule } from './modules/upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
      }),
    }),
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
    UploadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
