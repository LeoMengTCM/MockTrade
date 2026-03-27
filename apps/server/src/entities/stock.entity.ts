import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('stocks')
export class StockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  persona: string;

  @Column()
  sector: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  openPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  prevClosePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  dailyHigh: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  dailyLow: number;

  @Column({ type: 'bigint', default: 0 })
  volume: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
