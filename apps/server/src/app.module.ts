import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MarketModule } from './modules/market/market.module';
import { AIModule } from './modules/ai/ai.module';
import { NewsModule } from './modules/news/news.module';
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
    AdminModule,
  ],
})
export class AppModule {}
