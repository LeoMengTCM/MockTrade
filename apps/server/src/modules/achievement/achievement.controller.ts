import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementService } from './achievement.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Public()
  @Get()
  getAll() {
    return this.achievementService.getAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  getMy(@CurrentUser('id') userId: string) {
    return this.achievementService.getAll(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('check')
  check(@CurrentUser('id') userId: string) {
    return this.achievementService.checkAndUnlock(userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('seed')
  seed() {
    return this.achievementService.seedAchievements();
  }
}
