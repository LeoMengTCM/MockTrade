import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementEntity } from '../../entities/achievement.entity';
import { UserAchievementEntity } from '../../entities/user-achievement.entity';
import { OrderEntity } from '../../entities/order.entity';
import { PositionEntity } from '../../entities/position.entity';
import { MarketModule } from '../market/market.module';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AchievementEntity, UserAchievementEntity, OrderEntity, PositionEntity]), MarketModule],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}
