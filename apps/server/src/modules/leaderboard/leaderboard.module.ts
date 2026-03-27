import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeasonEntity } from '../../entities/season.entity';
import { UserEntity } from '../../entities/user.entity';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SeasonEntity, UserEntity])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
