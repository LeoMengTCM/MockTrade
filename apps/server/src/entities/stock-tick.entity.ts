import {
  Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn,
} from 'typeorm';

@Entity('stock_ticks')
@Index(['stockId', 'timestamp'])
export class StockTickEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  stockId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  volume: number;

  @CreateDateColumn()
  timestamp: Date;
}
