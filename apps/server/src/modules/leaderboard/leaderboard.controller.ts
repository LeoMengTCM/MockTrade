import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeasonEntity } from '../../entities/season.entity';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    @InjectRepository(SeasonEntity) private readonly seasonRepo: Repository<SeasonEntity>,
  ) {}

  @Public()
  @Get(':type')
  async getLeaderboard(@Param('type') type: string, @Query('seasonId') seasonId?: string, @Query('limit') limit = '100') {
    const sid = seasonId || (await this.seasonRepo.findOne({ where: { isActive: true } }))?.id;
    if (!sid) return [];
    return this.leaderboardService.getTop(sid, type, parseInt(limit));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':type/my-rank')
  async getMyRank(@Param('type') type: string, @CurrentUser('id') userId: string, @Query('seasonId') seasonId?: string) {
    const sid = seasonId || (await this.seasonRepo.findOne({ where: { isActive: true } }))?.id;
    if (!sid) return { rank: null, score: 0 };
    return this.leaderboardService.getMyRank(sid, type, userId);
  }
}
