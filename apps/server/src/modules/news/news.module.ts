import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsEntity } from '../../entities/news.entity';
import { StockEntity } from '../../entities/stock.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { MarketModule } from '../market/market.module';
import { NewsGeneratorService } from './news-generator.service';
import { NewsPublisherService } from './news-publisher.service';
import { NewsController } from './news.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NewsEntity, StockEntity, SeasonEntity]), MarketModule],
  controllers: [NewsController],
  providers: [NewsGeneratorService, NewsPublisherService],
  exports: [NewsGeneratorService, NewsPublisherService],
})
export class NewsModule {}
