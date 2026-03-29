import { Controller, Post, Get, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TradeService } from './trade.service';
import { PositionService } from './position.service';
import { AccountService } from './account.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeasonEntity } from '../../entities/season.entity';

@Controller('trade')
@UseGuards(AuthGuard('jwt'))
export class TradeController {
  constructor(
    private readonly tradeService: TradeService,
    private readonly positionService: PositionService,
    private readonly accountService: AccountService,
    @InjectRepository(SeasonEntity) private readonly seasonRepo: Repository<SeasonEntity>,
  ) {}

  @Post('orders')
  createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.tradeService.createOrder(userId, dto);
  }

  @Delete('orders/:id')
  cancelOrder(@CurrentUser('id') userId: string, @Param('id') orderId: string) {
    return this.tradeService.cancelOrder(userId, orderId);
  }

  @Get('orders')
  getOrders(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('stockId') stockId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.tradeService.getOrders(userId, status, parseInt(page), parseInt(limit), stockId);
  }

  @Get('orders/active')
  getActiveOrders(@CurrentUser('id') userId: string) {
    return this.tradeService.getActiveOrders(userId);
  }

  @Get('positions')
  async getPositions(@CurrentUser('id') userId: string) {
    const season = await this.seasonRepo.findOne({ where: { isActive: true } });
    if (!season) return [];
    return this.positionService.getPositions(userId, season.id);
  }

  @Get('account')
  async getAccount(@CurrentUser('id') userId: string) {
    const season = await this.seasonRepo.findOne({ where: { isActive: true } });
    if (!season) return { availableCash: 0, frozenCash: 0, totalAssets: 0, totalPnl: 0, returnRate: 0 };
    const account = await this.accountService.getAccount(userId, season.id);
    const marketValue = await this.positionService.getTotalMarketValue(userId, season.id);
    const totalAssets = +(account.availableCash + account.frozenCash + marketValue).toFixed(2);
    const initialCapital = 1000000;
    return {
      ...account,
      marketValue: +marketValue.toFixed(2),
      totalAssets,
      totalPnl: +(totalAssets - initialCapital).toFixed(2),
      returnRate: +((totalAssets - initialCapital) / initialCapital).toFixed(6),
    };
  }
}
