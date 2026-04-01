import {
  Entity, PrimaryGeneratedColumn, Column, Index,
} from 'typeorm';

@Entity('stock_ticks')
@Index(['stockId', 'timestamp'])
@Index(['stockId', 'marketDayStartedAt', 'timestamp'])
export class StockTickEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  stockId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  volume: number;

  @Column({ type: 'uuid', nullable: true })
  marketDayId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  marketDayStartedAt: Date | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
