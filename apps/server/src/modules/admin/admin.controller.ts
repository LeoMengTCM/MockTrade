import { BadRequestException, Controller, Post, Get, Body, UseGuards, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketStatus } from '@mocktrade/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../../entities/user.entity';
import { OrderEntity } from '../../entities/order.entity';
import { AIService } from '../ai/ai.service';
import { AIHealthService } from '../ai/ai-health.service';
import { AISettingsService } from '../ai/ai-settings.service';
import { MarketStateService } from '../market/market-state.service';
import { EventImpact } from '../market/engine/event-impact';
import { NewsGeneratorService } from '../news/news-generator.service';
import { NewsPublisherService } from '../news/news-publisher.service';
import { MarketGateway } from '../market/market.gateway';
import { DisplaySettingsService } from '../market/display-settings.service';
import { ManualPriceInterventionService } from '../market/manual-price-intervention.service';
import { MarketRegimeService } from '../market/market-regime.service';
import { GenerateManualNewsDto } from './dto/generate-manual-news.dto';
import { UpdateAISettingsDto } from './dto/update-ai-settings.dto';
import { UpdateDisplaySettingsDto } from './dto/update-display-settings.dto';
import { NewsQueueStatsService } from '../news/news-queue-stats.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    private readonly aiService: AIService,
    private readonly aiHealth: AIHealthService,
    private readonly aiSettings: AISettingsService,
    private readonly marketState: MarketStateService,
    private readonly eventImpact: EventImpact,
    private readonly newsGenerator: NewsGeneratorService,
    private readonly newsPublisher: NewsPublisherService,
    private readonly gateway: MarketGateway,
    private readonly displaySettings: DisplaySettingsService,
    private readonly manualPriceIntervention: ManualPriceInterventionService,
    private readonly marketRegime: MarketRegimeService,
    private readonly newsQueueStats: NewsQueueStatsService,
  ) { }

  @Get('engine/status')
  async getEngineStatus() {
    const aiHealth = await this.aiHealth.getSummary(await this.aiService.isConfigured());

    return {
      marketStatus: this.marketState.getStatus(),
      marketRegime: this.marketRegime.getSnapshot(),
      cycleCount: this.marketState.getCycleCount(),
      activeImpacts: this.eventImpact.getActiveCount(),
      connectedClients: this.gateway.getConnectedCount(),
      aiStatus: aiHealth.status,
      aiConsecutiveFailures: aiHealth.consecutiveFailures,
    };
  }

  @Get('ai/settings')
  async getAISettings() {
    return this.aiSettings.getPublicSettings();
  }

  @Post('ai/settings')
  async updateAISettings(@Body() dto: UpdateAISettingsDto) {
    const settings = await this.aiSettings.saveSettings(dto);
    return {
      message: 'AI 配置已保存',
      settings,
    };
  }

  @Post('ai/test')
  async testAISettings(@Body() dto: UpdateAISettingsDto) {
    const result = await this.aiService.testConnection(dto);
    return {
      message: 'AI 连接测试成功',
      ...result,
    };
  }

  @Get('display-settings')
  async getDisplaySettings() {
    return this.displaySettings.getSettings();
  }

  @Post('display-settings')
  async updateDisplaySettings(@Body() dto: UpdateDisplaySettingsDto) {
    const settings = await this.displaySettings.saveSettings(dto);
    return {
      message: '显示设置已保存',
      settings,
    };
  }

  @Post('market/pause')
  pause() { this.marketState.pause(); return { message: 'Market paused' }; }

  @Post('market/resume')
  resume() { this.marketState.resume(); return { message: 'Market resumed' }; }

  @Post('market/durations')
  async setDurations(@Body() body: { openMs: number; closeMs: number }) {
    await this.marketState.setDurations(body.openMs, body.closeMs);
    return { message: 'Durations updated' };
  }

  @Post('news/generate')
  async generateNews() {
    const queuedNews = await this.newsGenerator.generateAndQueue();
    return {
      message: queuedNews ? `新闻已加入待发布队列：${queuedNews.title}` : '当前没有可生成新闻的股票',
      queuedNews,
      queueLength: await this.newsGenerator.getQueueLength(),
    };
  }

  @Post('news/publish')
  async publishNews() {
    const news = await this.newsPublisher.publishOne();
    return {
      message: news ? `新闻已发布：${news.title}` : '没有可发布的新闻',
      news,
      queueLength: await this.newsGenerator.getQueueLength(),
    };
  }

  @Post('news/manual')
  async generateManualNews(@Body() dto: GenerateManualNewsDto) {
    const request = {
      stockId: dto.stockId,
      impact: dto.impact,
      impactPercent: dto.impactPercent,
      style: dto.style,
      eventHint: dto.eventHint,
    };

    if (dto.publishNow) {
      if (this.marketState.getStatus() !== MarketStatus.OPENING) {
        throw new BadRequestException('当前不是开盘中，手动事件请先生成到队列');
      }

      const prepared = await this.newsGenerator.generateManual(request);
      const news = await this.newsPublisher.publishPreparedItem(prepared);

      return {
        message: `手动事件已发布：${news.title}`,
        news,
        queueLength: await this.newsGenerator.getQueueLength(),
      };
    }

    const queuedNews = await this.newsGenerator.generateManualAndQueue(request);
    return {
      message: `手动事件已加入待发布队列：${queuedNews.title}`,
      queuedNews,
      queueLength: await this.newsGenerator.getQueueLength(),
    };
  }

  @Post('stocks/:id/shock')
  async injectShock(@Param('id') id: string, @Body() body: { impactPercent: number; durationMs?: number }) {
    const result = await this.manualPriceIntervention.applyShock(id, body.impactPercent, body.durationMs || 60000);
    return {
      message: `已执行价格干预：${result.stockName}(${result.stockSymbol}) 立即变动 ${result.immediateChange >= 0 ? '+' : ''}${result.immediateChange.toFixed(2)}`,
      result,
    };
  }

  @Get('news/queue')
  async getQueue() {
    return {
      queueLength: await this.newsGenerator.getQueueLength(),
      items: await this.newsGenerator.getQueuePreview(5),
    };
  }

  @Get('news/queue-stats')
  async getQueueStats() {
    return this.newsQueueStats.getStats();
  }

  @Post('ai/reset-health')
  async resetAIHealth() {
    await this.aiHealth.resetHealth();
    return { message: 'AI 健康状态已手动重置' };
  }

  @Get('users')
  async getUsers(@Query('page') page = '1', @Query('limit') limit = '20') {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await this.userRepo.findAndCount({
      select: ['id', 'email', 'username', 'avatarUrl', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total, page: p, limit: l };
  }

  @Get('stats')
  async getStats() {
    const totalUsers = await this.userRepo.count();
    const totalOrders = await this.orderRepo.count();
    const filledOrders = await this.orderRepo.count({ where: { status: 'filled' } });
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: 'filled' })
      .select('SUM(CAST(o.filledPrice AS DECIMAL) * o.filledQuantity)', 'totalVolume')
      .getRawOne();
    return {
      totalUsers,
      totalOrders,
      filledOrders,
      totalVolume: +(result?.totalVolume || 0),
    };
  }
}
