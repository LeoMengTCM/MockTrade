import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('orders')
@Index(['userId', 'status'])
@Index(['stockId', 'status'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  stockId: string;

  @Column('uuid')
  seasonId: string;

  @Column({ type: 'enum', enum: ['market', 'limit'] })
  type: 'market' | 'limit';

  @Column({ type: 'enum', enum: ['buy', 'sell'] })
  side: 'buy' | 'sell';

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  filledPrice: number | null;

  @Column({ type: 'int', nullable: true })
  filledQuantity: number | null;

  @Column({ type: 'enum', enum: ['pending', 'filled', 'cancelled', 'expired'], default: 'pending' })
  status: 'pending' | 'filled' | 'cancelled' | 'expired';

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  commission: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  filledAt: Date | null;
}
