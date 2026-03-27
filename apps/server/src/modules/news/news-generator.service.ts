import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { AIService } from '../ai/ai.service';
import { WorldMemoryService } from '../ai/world-memory.service';
import { FallbackGenerator } from '../ai/fallback-generator';
import { RedisService } from '../redis/redis.service';

const SYSTEM_PROMPT = `你是 MockTrade 交易所的首席新闻编辑。为虚拟股市生成新闻。

规则：幽默夸张但有逻辑，标题20字内，正文100-200字，可引用虚构原话。

返回纯JSON：
{"title":"","content":"","sentiment":"bullish|bearish|funny|neutral|breaking","impact":"positive|negative|neutral","impactLevel":"minor|medium|major","impactPercent":0.05}

impactPercent范围：minor=0.01~0.03, medium=0.03~0.06, major=0.06~0.10。正数利好，负数利空。`;

@Injectable()
export class NewsGeneratorService {
  private readonly logger = new Logger(NewsGeneratorService.name);
  private readonly QUEUE_KEY = 'news:pending';

  constructor(
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    private readonly ai: AIService,
    private readonly worldMemory: WorldMemoryService,
    private readonly fallback: FallbackGenerator,
    private readonly redis: RedisService,
  ) {}

  async generateAndQueue(): Promise<void> {
    const stocks = await this.stockRepo.find({ where: { isActive: true } });
    if (stocks.length === 0) return;
    const stock = stocks[Math.floor(Math.random() * stocks.length)];

    try {
      let newsData: any;
      if (this.ai.isConfigured()) {
        const context = await this.worldMemory.buildContext(stock.id);
        newsData = await this.ai.generateJSON(SYSTEM_PROMPT, `请为"${stock.name}"(${stock.symbol})生成新闻。\n\n${context}`, { temperature: 0.9, maxTokens: 800 });
      } else {
        newsData = this.buildFallback(stock);
      }
      newsData.stockId = stock.id;
      newsData.stockSymbol = stock.symbol;
      newsData.stockName = stock.name;
      await this.redis.lPush(this.QUEUE_KEY, JSON.stringify(newsData));
      await this.worldMemory.addNewsMemory(stock.id, `${newsData.sentiment}: ${newsData.title}`);
      this.logger.log(`Queued: ${stock.symbol} - "${newsData.title}"`);
    } catch (e) {
      this.logger.error(`Generation failed for ${stock.symbol}, fallback`, e);
      const fb = this.buildFallback(stock);
      fb.stockId = stock.id; fb.stockSymbol = stock.symbol; fb.stockName = stock.name;
      await this.redis.lPush(this.QUEUE_KEY, JSON.stringify(fb));
    }
  }

  private buildFallback(stock: StockEntity): any {
    const news = this.fallback.generate(stock.name, stock.symbol);
    const sign = news.impact === 'positive' ? 1 : -1;
    const impactPercent = news.impactLevel === 'major' ? (Math.random() * 0.04 + 0.06) * sign
      : news.impactLevel === 'medium' ? (Math.random() * 0.03 + 0.03) * sign
      : (Math.random() * 0.02 + 0.01) * sign;
    return { ...news, impactPercent };
  }

  async getQueueLength() { return this.redis.lLen(this.QUEUE_KEY); }
  async popFromQueue() { const r = await this.redis.rPop(this.QUEUE_KEY); return r ? JSON.parse(r) : null; }

  async ensureQueueFilled(min = 3) {
    const len = await this.getQueueLength();
    if (len < min) {
      for (let i = 0; i < min - len; i++) await this.generateAndQueue();
    }
  }
}
