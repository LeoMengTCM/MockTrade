import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('news')
export class NewsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ['bullish', 'bearish', 'funny', 'neutral', 'breaking'], default: 'neutral' })
  sentiment: 'bullish' | 'bearish' | 'funny' | 'neutral' | 'breaking';

  @Column({ type: 'enum', enum: ['positive', 'negative', 'neutral'], default: 'neutral' })
  impact: 'positive' | 'negative' | 'neutral';

  @Column({ type: 'enum', enum: ['minor', 'medium', 'major'], default: 'minor' })
  impactLevel: 'minor' | 'medium' | 'major';

  @Column({ type: 'jsonb', default: [] })
  relatedStockIds: string[];

  @Column({ type: 'jsonb', default: {} })
  impactPercents: Record<string, number>;

  @Column('uuid')
  seasonId: string;

  @Column({ type: 'varchar', nullable: true })
  storylineId: string | null;

  @CreateDateColumn()
  publishedAt: Date;
}
