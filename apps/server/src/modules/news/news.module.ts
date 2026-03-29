import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsEntity } from '../../entities/news.entity';
import { StockEntity } from '../../entities/stock.entity';
import { MarketModule } from '../market/market.module';
import { SeasonModule } from '../season/season.module';
import { NewsGeneratorService } from './news-generator.service';
import { NewsPublisherService } from './news-publisher.service';
import { NewsController } from './news.controller';
import { NEWS_BUFFER_QUEUE, NEWS_SCHEDULER_QUEUE } from './news.constants';
import { NewsQueueProcessor } from './news-queue.processor';
import { NewsQueueStatsService } from './news-queue-stats.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: NEWS_BUFFER_QUEUE },
      { name: NEWS_SCHEDULER_QUEUE },
    ),
    TypeOrmModule.forFeature([NewsEntity, StockEntity]),
    MarketModule,
    SeasonModule,
  ],
  controllers: [NewsController],
  providers: [NewsGeneratorService, NewsPublisherService, NewsQueueProcessor, NewsQueueStatsService],
  exports: [NewsGeneratorService, NewsPublisherService, NewsQueueStatsService],
})
export class NewsModule { }
