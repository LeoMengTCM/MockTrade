import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeasonEntity } from '../../entities/season.entity';
import { SeasonRecordEntity } from '../../entities/season-record.entity';
import { UserEntity } from '../../entities/user.entity';
import { PositionEntity } from '../../entities/position.entity';
import { StockEntity } from '../../entities/stock.entity';
import { SeasonService } from './season.service';
import { SeasonController } from './season.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SeasonEntity, SeasonRecordEntity, UserEntity, PositionEntity, StockEntity])],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}
