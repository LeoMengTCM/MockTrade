import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '../../entities/news.entity';
import { StockEntity } from '../../entities/stock.entity';
import { Public } from '../../common/decorators/public.decorator';

@Controller('news')
export class NewsController {
  constructor(
    @InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
  ) {}

  private async serializeNews(news: NewsEntity | null) {
    if (!news) return null;

    const relatedStocks = news.relatedStockIds.length > 0
      ? await this.stockRepo.findBy(news.relatedStockIds.map((id) => ({ id })))
      : [];
    const stockMap = new Map(relatedStocks.map((stock) => [stock.id, stock]));

    return {
      id: news.id,
      title: news.title,
      content: news.content,
      sentiment: news.sentiment,
      impact: news.impact,
      impactLevel: news.impactLevel,
      relatedStockIds: news.relatedStockIds,
      relatedStocks: news.relatedStockIds.map((stockId) => {
        const stock = stockMap.get(stockId);
        return {
          id: stockId,
          symbol: stock?.symbol || 'UNKNOWN',
          name: stock?.name || stockId.slice(0, 8),
        };
      }),
      impactPercents: news.newsType === 'recap' ? news.impactPercents : {},
      newsType: news.newsType,
      sourceNewsId: news.sourceNewsId,
      publishedCycle: news.publishedCycle,
      seasonId: news.seasonId,
      storylineId: news.storylineId,
      publishedAt: news.publishedAt,
    };
  }

  @Public()
  @Get()
  async getNews(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('stockId') stockId?: string,
    @Query('sentiment') sentiment?: string,
    @Query('newsType') newsType?: string,
  ) {
    const qb = this.newsRepo.createQueryBuilder('news').orderBy('news.publishedAt', 'DESC')
      .skip((parseInt(page) - 1) * parseInt(limit)).take(parseInt(limit));
    if (stockId) {
      qb.andWhere('news.relatedStockIds @> CAST(:relatedStockIds AS jsonb)', {
        relatedStockIds: JSON.stringify([stockId]),
      });
    }
    if (sentiment) qb.andWhere('news.sentiment = :sentiment', { sentiment });
    if (newsType) qb.andWhere('news.newsType = :newsType', { newsType });
    const [items, total] = await qb.getManyAndCount();
    return {
      items: await Promise.all(items.map((item) => this.serializeNews(item))),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  @Public()
  @Get('latest')
  async getLatest() {
    const items = await this.newsRepo.find({ order: { publishedAt: 'DESC' }, take: 5 });
    return Promise.all(items.map((item) => this.serializeNews(item)));
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    const news = await this.newsRepo.findOne({ where: { id } });
    return this.serializeNews(news);
  }
}
