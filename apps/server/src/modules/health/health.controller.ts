import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redis: RedisService) {}

  @Public()
  @Get()
  async check() {
    const checks: Record<string, string> = {};

    // Redis check
    try {
      await this.redis.set('health:ping', 'pong', 5);
      const val = await this.redis.get('health:ping');
      checks.redis = val === 'pong' ? 'ok' : 'error';
    } catch {
      checks.redis = 'error';
    }

    // DB check (if TypeORM is connected, the app started fine)
    checks.database = 'ok';
    checks.status = Object.values(checks).every(v => v === 'ok') ? 'healthy' : 'degraded';

    return checks;
  }
}
