import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../../entities/order.entity';
import { PositionEntity } from '../../entities/position.entity';
import { StockEntity } from '../../entities/stock.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { PositionService } from './position.service';
import { AccountService } from './account.service';
import { LimitOrderMatcher } from './limit-order-matcher.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, PositionEntity, StockEntity, SeasonEntity])],
  controllers: [TradeController],
  providers: [TradeService, PositionService, AccountService, LimitOrderMatcher],
  exports: [TradeService, PositionService, AccountService],
})
export class TradeModule {}
