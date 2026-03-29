import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { MarketStatus } from '@mocktrade/shared';
import { Repository } from 'typeorm';
import { NewsEntity } from '../../entities/news.entity';
import { StockEntity } from '../../entities/stock.entity';
import { EventImpact } from '../market/engine/event-impact';
import { MarketGateway } from '../market/market.gateway';
import { MarketStateService } from '../market/market-state.service';
import { SeasonService } from '../season/season.service';
import { NewsGeneratorService, QueuedNewsItem } from './news-generator.service';
import { NEWS_PUBLISH_JOB, NEWS_SCHEDULER_QUEUE } from './news.constants';

@Injectable()
export class NewsPublisherService implements OnModuleInit {
  private readonly logger = new Logger(NewsPublisherService.name);
  private readonly schedulerRunId = randomUUID();

  constructor(
    @InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    @InjectQueue(NEWS_SCHEDULER_QUEUE) private readonly schedulerQueue: Queue,
    private readonly generator: NewsGeneratorService,
    private readonly eventImpact: EventImpact,
    private readonly gateway: MarketGateway,
    private readonly marketState: MarketStateService,
    private readonly seasonService: SeasonService,
  ) {}

  async onModuleInit() {
    await this.clearScheduledPublishJobs();
    await this.generator.migrateLegacyQueue();

    this.marketState.onStatusChange((status) => {
      void this.handleMarketStatusChange(status).catch((error) => {
        this.logger.error('Failed to handle market status change', error);
      });
    });

    this.generator.ensureQueueFilled(5).catch((error) => {
      this.logger.error('Queue fill failed', error);
    });

    if (this.marketState.getStatus() === MarketStatus.OPENING) {
      void this.handleMarketOpening().catch((error) => {
        this.logger.error('Failed to bootstrap opening publish schedule', error);
      });
    }
  }

  private classifyImpactLevel(percent: number): 'minor' | 'medium' | 'major' {
    const abs = Math.abs(percent);
    if (abs >= 0.06) return 'major';
    if (abs >= 0.03) return 'medium';
    return 'minor';
  }

  private classifySentiment(percent: number): 'bullish' | 'bearish' | 'neutral' {
    if (percent >= 0.005) return 'bullish';
    if (percent <= -0.005) return 'bearish';
    return 'neutral';
  }

  private buildRecapCopy(sourceNews: NewsEntity, stock: StockEntity, actualPercent: number) {
    const absPercent = Math.abs(actualPercent * 100).toFixed(1);
    if (Math.abs(actualPercent) < 0.005) {
      return {
        title: `${stock.name}消化消息后基本持平`,
        content: `上一交易日《${sourceNews.title}》发布后，${stock.name}(${stock.symbol})在盘中经历了一轮情绪波动，但截至收盘前后整体仍以震荡为主，较消息发布时基本持平。`,
      };
    }

    const direction = actualPercent > 0 ? '上涨' : '下跌';
    const tone = actualPercent > 0 ? '买盘逐步占优' : '抛压逐步释放';
    return {
      title: `${stock.name}消化消息后${direction}${absPercent}%`,
      content: `上一交易日《${sourceNews.title}》发布后，${stock.name}(${stock.symbol})在盘中逐步消化消息，${tone}。截至收盘统计，股价较消息发布时${direction}${absPercent}%。`,
    };
  }

  private async handleMarketStatusChange(status: MarketStatus) {
    if (status === MarketStatus.OPENING) {
      await this.handleMarketOpening();
      return;
    }

    await this.clearScheduledPublishJobs();
  }

  private async handleMarketOpening() {
    await this.clearScheduledPublishJobs();
    await this.publishPendingRecaps();
    await this.scheduleOpeningPublishes();

    this.generator.ensureQueueFilled(5).catch((error) => {
      this.logger.error('Queue fill failed during opening', error);
    });
  }

  private async scheduleOpeningPublishes() {
    const cycle = this.marketState.getCycleCount();
    const openDuration = this.marketState.getOpenDuration();
    const lastSafeDelay = openDuration - 1000;

    if (lastSafeDelay <= 0) {
      return;
    }

    let delay = Math.min(10000, lastSafeDelay);
    let index = 0;

    while (delay <= lastSafeDelay) {
      await this.schedulerQueue.add(
        NEWS_PUBLISH_JOB,
        { cycle, index },
        {
          jobId: this.buildPublishJobId(cycle, index),
          delay,
          attempts: 2,
          backoff: { type: 'fixed', delay: 3000 },
          removeOnComplete: 50,
          removeOnFail: 50,
        },
      );

      index++;
      delay += Math.floor(Math.random() * 40000) + 20000;
    }

    this.logger.log(`Scheduled ${index} publish jobs for cycle #${cycle}`);
  }

  private buildPublishJobId(cycle: number, index: number) {
    return `news-publish:${this.schedulerRunId}:${cycle}:${index}`;
  }

  private async clearScheduledPublishJobs() {
    const jobs = await this.schedulerQueue.getJobs(['waiting', 'delayed'], 0, -1);
    let removed = 0;

    for (const job of jobs) {
      if (job.name !== NEWS_PUBLISH_JOB) {
        continue;
      }

      await job.remove();
      removed++;
    }

    if (removed > 0) {
      this.logger.log(`Cleared ${removed} scheduled publish jobs`);
    }
  }

  private async publishPendingRecaps() {
    const currentCycle = this.marketState.getCycleCount();
    if (currentCycle <= 1) return;

    const season = await this.seasonService.getActiveSeason();
    if (!season) return;

    const sourceNewsList = await this.newsRepo.find({
      where: {
        seasonId: season.id,
        newsType: 'event',
      },
      order: { publishedAt: 'ASC' },
    });

    for (const sourceNews of sourceNewsList) {
      if (sourceNews.publishedCycle <= 0) continue;
      if (sourceNews.publishedCycle >= currentCycle) continue;
      if (!sourceNews.referencePrices || Object.keys(sourceNews.referencePrices).length === 0) continue;

      const existingRecap = await this.newsRepo.findOne({
        where: {
          sourceNewsId: sourceNews.id,
          newsType: 'recap',
        },
      });
      if (existingRecap) continue;

      const stocks = sourceNews.relatedStockIds.length > 0
        ? await this.stockRepo.findBy(sourceNews.relatedStockIds.map((id) => ({ id })))
        : [];
      if (stocks.length === 0) continue;

      const impactPercents: Record<string, number> = {};
      for (const stock of stocks) {
        const referencePrice = Number(sourceNews.referencePrices?.[stock.id] || 0);
        if (referencePrice <= 0) continue;
        impactPercents[stock.id] = +(((Number(stock.currentPrice) - referencePrice) / referencePrice).toFixed(6));
      }
      if (Object.keys(impactPercents).length === 0) continue;

      const primaryStock = stocks[0];
      const primaryPercent = impactPercents[primaryStock.id] || 0;
      const recapCopy = this.buildRecapCopy(sourceNews, primaryStock, primaryPercent);

      const recap = this.newsRepo.create({
        title: recapCopy.title,
        content: recapCopy.content,
        sentiment: this.classifySentiment(primaryPercent),
        impact: primaryPercent >= 0.005 ? 'positive' : primaryPercent <= -0.005 ? 'negative' : 'neutral',
        impactLevel: this.classifyImpactLevel(primaryPercent),
        relatedStockIds: sourceNews.relatedStockIds,
        impactPercents,
        newsType: 'recap',
        referencePrices: sourceNews.referencePrices,
        sourceNewsId: sourceNews.id,
        publishedCycle: currentCycle,
        seasonId: season.id,
        storylineId: sourceNews.storylineId,
      });

      await this.newsRepo.save(recap);
      this.gateway.broadcastNews({
        id: recap.id,
        title: recap.title,
        sentiment: recap.sentiment,
        relatedStockIds: recap.relatedStockIds,
      });
      this.logger.log(`Published recap: "${recap.title}"`);
    }
  }

  async publishOne(options: { scheduled?: boolean; cycle?: number } = {}): Promise<NewsEntity | null> {
    if (options.scheduled) {
      if (this.marketState.getStatus() !== MarketStatus.OPENING) {
        this.logger.warn('Skipping scheduled news publish because market is not open');
        return null;
      }

      if (typeof options.cycle === 'number' && options.cycle !== this.marketState.getCycleCount()) {
        this.logger.warn(`Skipping stale scheduled publish job for cycle #${options.cycle}`);
        return null;
      }
    }

    let data = await this.generator.popFromQueue();
    if (!data) {
      data = await this.generator.generateOne();
    }
    if (!data) {
      return null;
    }

    return this.publishPreparedItem(data);
  }

  async publishPreparedItem(data: QueuedNewsItem): Promise<NewsEntity> {
    const season = await this.seasonService.getActiveSeason();
    if (!season) {
      throw new BadRequestException('当前没有活动赛季，请先在管理后台创建赛季');
    }

    const cycle = this.marketState.getCycleCount();
    const stock = await this.stockRepo.findOne({ where: { id: data.stockId } });
    const referencePrices = stock ? { [data.stockId]: Number(stock.currentPrice) } : {};

    const news = this.newsRepo.create({
      title: data.title,
      content: data.content,
      sentiment: data.sentiment || 'neutral',
      impact: data.impact || 'neutral',
      impactLevel: data.impactLevel || 'minor',
      relatedStockIds: [data.stockId],
      impactPercents: { [data.stockId]: data.impactPercent || 0 },
      newsType: 'event',
      referencePrices,
      sourceNewsId: null,
      publishedCycle: cycle,
      seasonId: season.id,
      storylineId: null,
    });
    await this.newsRepo.save(news);

    const dur = data.impactLevel === 'major' ? 90000 : data.impactLevel === 'medium' ? 60000 : 30000;
    this.eventImpact.inject(data.stockId, data.impactPercent || 0, dur);
    this.gateway.broadcastNews({
      id: news.id,
      title: news.title,
      sentiment: news.sentiment,
      relatedStockIds: news.relatedStockIds,
    });

    this.logger.log(
      `Published: [${news.sentiment}] "${news.title}" -> ${data.stockSymbol} ${((data.impactPercent || 0) * 100).toFixed(1)}%`,
    );

    this.generator.ensureQueueFilled(3).catch((error) => {
      this.logger.error('Queue refill failed after publish', error);
    });

    return news;
  }
}
