import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('season_records')
export class SeasonRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  seasonId: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  finalAssets: number;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  returnRate: number;

  @Column({ type: 'enum', enum: ['bronze', 'silver', 'gold', 'diamond', 'legendary'] })
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';

  @Column({ type: 'int' })
  ranking: number;
}
