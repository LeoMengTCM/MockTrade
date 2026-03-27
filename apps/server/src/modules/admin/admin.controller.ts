import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MarketStateService } from '../market/market-state.service';
import { EventImpact } from '../market/engine/event-impact';
import { NewsGeneratorService } from '../news/news-generator.service';
import { NewsPublisherService } from '../news/news-publisher.service';
import { MarketGateway } from '../market/market.gateway';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly marketState: MarketStateService,
    private readonly eventImpact: EventImpact,
    private readonly newsGenerator: NewsGeneratorService,
    private readonly newsPublisher: NewsPublisherService,
    private readonly gateway: MarketGateway,
  ) {}

  @Get('engine/status')
  getEngineStatus() {
    return {
      marketStatus: this.marketState.getStatus(),
      cycleCount: this.marketState.getCycleCount(),
      activeImpacts: this.eventImpact.getActiveCount(),
      connectedClients: this.gateway.getConnectedCount(),
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
  async generateNews() { await this.newsGenerator.generateAndQueue(); return { message: 'News queued' }; }

  @Post('news/publish')
  async publishNews() { const news = await this.newsPublisher.publishOne(); return { message: 'Published', news }; }

  @Post('stocks/:id/shock')
  injectShock(@Param('id') id: string, @Body() body: { impactPercent: number; durationMs?: number }) {
    this.eventImpact.inject(id, body.impactPercent, body.durationMs || 60000);
    return { message: 'Shock injected' };
  }

  @Get('news/queue')
  async getQueue() { return { queueLength: await this.newsGenerator.getQueueLength() }; }
}
