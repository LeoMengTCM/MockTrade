import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { StockEntity } from '../../entities/stock.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WorldMemoryService {
  private readonly logger = new Logger(WorldMemoryService.name);
  private worldSetting = '';
  private relationships = '';

  constructor(
    private readonly redis: RedisService,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
  ) {
    this.loadWorldFiles();
  }

  private loadWorldFiles() {
    try {
      const worldDir = path.resolve(process.cwd(), '../../world');
      const settingPath = path.join(worldDir, 'world-setting.md');
      const relPath = path.join(worldDir, 'relationships.md');
      if (fs.existsSync(settingPath)) this.worldSetting = fs.readFileSync(settingPath, 'utf-8');
      if (fs.existsSync(relPath)) this.relationships = fs.readFileSync(relPath, 'utf-8');
      this.logger.log('World files loaded');
    } catch { this.logger.warn('Failed to load world files'); }
  }

  async buildContext(stockId: string): Promise<string> {
    const stock = await this.stockRepo.findOne({ where: { id: stockId } });
    if (!stock) return '';
    const recentNews = await this.getRecentNews(stockId, 5);
    const related = await this.getRelatedContext(stock);

    return `## 世界观\n${this.worldSetting}\n\n## 目标股票\n- ${stock.symbol} ${stock.name} (${stock.sector})\n- 人设: ${stock.persona}\n- 当前价: $${stock.currentPrice}, 基准价: $${stock.basePrice}\n\n## 近期新闻\n${recentNews.length > 0 ? recentNews.join('\n') : '暂无'}\n\n## 相关股票\n${related}\n\n## 关系图\n${this.relationships}`;
  }

  async addNewsMemory(stockId: string, summary: string) {
    await this.redis.lPush(`memory:news:${stockId}`, `[${new Date().toISOString()}] ${summary}`);
  }

  async getRecentNews(stockId: string, count = 5): Promise<string[]> {
    return this.redis.lRange(`memory:news:${stockId}`, 0, count - 1);
  }

  private async getRelatedContext(stock: StockEntity): Promise<string> {
    const peers = await this.stockRepo.find({ where: { sector: stock.sector, isActive: true } });
    return peers.filter(s => s.id !== stock.id).map(s => `- ${s.symbol}: $${s.currentPrice}`).join('\n') || '无';
  }

  async clearSeasonMemory() { this.logger.log('Season memory cleared'); }
}
