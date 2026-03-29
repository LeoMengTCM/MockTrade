import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entities/user.entity';
import { OrderEntity } from '../../entities/order.entity';
import { MarketModule } from '../market/market.module';
import { NewsModule } from '../news/news.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, OrderEntity]), MarketModule, NewsModule],
  controllers: [AdminController],
})
export class AdminModule {}
