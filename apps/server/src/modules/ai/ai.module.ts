import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { AIService } from './ai.service';
import { AISettingsService } from './ai-settings.service';
import { AIHealthService } from './ai-health.service';
import { WorldMemoryService } from './world-memory.service';
import { FallbackGenerator } from './fallback-generator';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([StockEntity])],
  providers: [AIService, AISettingsService, AIHealthService, WorldMemoryService, FallbackGenerator],
  exports: [AIService, AISettingsService, AIHealthService, WorldMemoryService, FallbackGenerator],
})
export class AIModule {}
