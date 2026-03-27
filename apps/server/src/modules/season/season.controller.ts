import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeasonService } from './season.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Public()
  @Get()
  getSeasons() {
    return this.seasonService.getSeasons();
  }

  @Public()
  @Get('current')
  getActiveSeason() {
    return this.seasonService.getActiveSeason();
  }

  @Public()
  @Get(':id/results')
  getSeasonResults(@Param('id') id: string) {
    return this.seasonService.getSeasonResults(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-history')
  getUserHistory(@CurrentUser('id') userId: string) {
    return this.seasonService.getUserSeasonHistory(userId);
  }

  // Admin endpoints
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post()
  createSeason(@Body() body: { name: string; startDate: string; endDate: string }) {
    return this.seasonService.createSeason(body.name, new Date(body.startDate), new Date(body.endDate));
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post(':id/end')
  endSeason(@Param('id') id: string) {
    return this.seasonService.endSeason(id);
  }
}
