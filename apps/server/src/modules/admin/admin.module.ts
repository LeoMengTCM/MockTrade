import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module';
import { NewsModule } from '../news/news.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [MarketModule, NewsModule],
  controllers: [AdminController],
})
export class AdminModule {}
