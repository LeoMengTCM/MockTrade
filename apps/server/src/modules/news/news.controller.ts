import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '../../entities/news.entity';
import { Public } from '../../common/decorators/public.decorator';

@Controller('news')
export class NewsController {
  constructor(@InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>) {}

  @Public()
  @Get()
  async getNews(@Query('page') page = '1', @Query('limit') limit = '20', @Query('stockId') stockId?: string, @Query('sentiment') sentiment?: string) {
    const qb = this.newsRepo.createQueryBuilder('news').orderBy('news.publishedAt', 'DESC')
      .skip((parseInt(page) - 1) * parseInt(limit)).take(parseInt(limit));
    if (stockId) qb.andWhere(':stockId = ANY(news.relatedStockIds)', { stockId });
    if (sentiment) qb.andWhere('news.sentiment = :sentiment', { sentiment });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: parseInt(page), limit: parseInt(limit) };
  }

  @Public()
  @Get('latest')
  async getLatest() { return this.newsRepo.find({ order: { publishedAt: 'DESC' }, take: 5 }); }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) { return this.newsRepo.findOne({ where: { id } }); }
}
