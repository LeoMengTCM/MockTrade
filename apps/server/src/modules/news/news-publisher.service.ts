import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '../../entities/news.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { NewsGeneratorService } from './news-generator.service';
import { EventImpact } from '../market/engine/event-impact';
import { MarketGateway } from '../market/market.gateway';
import { MarketStateService } from '../market/market-state.service';
import { MarketStatus } from '@mocktrade/shared';

@Injectable()
export class NewsPublisherService implements OnModuleInit {
  private readonly logger = new Logger(NewsPublisherService.name);
  private publishTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(SeasonEntity) private readonly seasonRepo: Repository<SeasonEntity>,
    private readonly generator: NewsGeneratorService,
    private readonly eventImpact: EventImpact,
    private readonly gateway: MarketGateway,
    private readonly marketState: MarketStateService,
  ) {}

  onModuleInit() {
    this.marketState.onStatusChange((status) => {
      if (status === MarketStatus.OPENING) this.startPublishing();
      else this.stopPublishing();
    });
    this.generator.ensureQueueFilled(5).catch(e => this.logger.error('Queue fill failed', e));
  }

  private startPublishing() {
    this.publishTimer = setTimeout(() => this.publishCycle(), 10000);
  }

  private stopPublishing() {
    if (this.publishTimer) { clearTimeout(this.publishTimer); this.publishTimer = null; }
  }

  private async publishCycle() {
    if (this.marketState.getStatus() !== MarketStatus.OPENING) return;
    try { await this.publishOne(); } catch (e) { this.logger.error('Publish error', e); }
    const delay = Math.floor(Math.random() * 40000) + 20000;
    this.publishTimer = setTimeout(() => this.publishCycle(), delay);
    this.generator.ensureQueueFilled(3).catch(() => {});
  }

  async publishOne(): Promise<NewsEntity | null> {
    const data = await this.generator.popFromQueue();
    if (!data) { await this.generator.generateAndQueue(); return null; }

    const season = await this.seasonRepo.findOne({ where: { isActive: true } });
    const news = this.newsRepo.create({
      title: data.title, content: data.content,
      sentiment: data.sentiment || 'neutral', impact: data.impact || 'neutral',
      impactLevel: data.impactLevel || 'minor',
      relatedStockIds: [data.stockId],
      impactPercents: { [data.stockId]: data.impactPercent || 0 },
      seasonId: season?.id || 'no-season',
    });
    await this.newsRepo.save(news);

    const dur = data.impactLevel === 'major' ? 90000 : data.impactLevel === 'medium' ? 60000 : 30000;
    this.eventImpact.inject(data.stockId, data.impactPercent || 0, dur);
    this.gateway.broadcastNews({ id: news.id, title: news.title, sentiment: news.sentiment, relatedStockIds: news.relatedStockIds });

    this.logger.log(`Published: [${news.sentiment}] "${news.title}" -> ${data.stockSymbol} ${((data.impactPercent || 0) * 100).toFixed(1)}%`);
    return news;
  }
}
