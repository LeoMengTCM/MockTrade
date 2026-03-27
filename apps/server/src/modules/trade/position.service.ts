import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionEntity } from '../../entities/position.entity';
import { StockEntity } from '../../entities/stock.entity';
import { calcNewAvgCost } from '@mocktrade/shared';

@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(PositionEntity) private readonly posRepo: Repository<PositionEntity>,
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
  ) {}

  async getPositions(userId: string, seasonId: string) {
    const positions = await this.posRepo.find({ where: { userId, seasonId } });
    const result = [];
    for (const pos of positions) {
      if (pos.quantity <= 0) continue;
      const stock = await this.stockRepo.findOne({ where: { id: pos.stockId } });
      if (!stock) continue;
      const currentPrice = Number(stock.currentPrice);
      const marketValue = +(pos.quantity * currentPrice).toFixed(2);
      const costBasis = +(pos.quantity * Number(pos.avgCost)).toFixed(2);
      const pnl = +(marketValue - costBasis).toFixed(2);
      const pnlPercent = costBasis > 0 ? +((marketValue - costBasis) / costBasis).toFixed(6) : 0;
      result.push({
        id: pos.id, stockId: pos.stockId, stockSymbol: stock.symbol, stockName: stock.name,
        quantity: pos.quantity, avgCost: Number(pos.avgCost), currentPrice, marketValue, pnl, pnlPercent,
      });
    }
    return result;
  }

  async getPosition(userId: string, stockId: string, seasonId: string): Promise<PositionEntity | null> {
    return this.posRepo.findOne({ where: { userId, stockId, seasonId } });
  }

  async addPosition(userId: string, stockId: string, seasonId: string, quantity: number, price: number): Promise<void> {
    let pos = await this.getPosition(userId, stockId, seasonId);
    if (pos) {
      const newAvgCost = calcNewAvgCost(pos.quantity, Number(pos.avgCost), quantity, price);
      pos.quantity += quantity;
      pos.avgCost = newAvgCost as any;
      await this.posRepo.save(pos);
    } else {
      pos = this.posRepo.create({ userId, stockId, seasonId, quantity, avgCost: price as any });
      await this.posRepo.save(pos);
    }
  }

  async reducePosition(userId: string, stockId: string, seasonId: string, quantity: number): Promise<boolean> {
    const pos = await this.getPosition(userId, stockId, seasonId);
    if (!pos || pos.quantity < quantity) return false;
    pos.quantity -= quantity;
    await this.posRepo.save(pos);
    return true;
  }

  async getTotalMarketValue(userId: string, seasonId: string): Promise<number> {
    const positions = await this.getPositions(userId, seasonId);
    return positions.reduce((sum, p) => sum + p.marketValue, 0);
  }
}
