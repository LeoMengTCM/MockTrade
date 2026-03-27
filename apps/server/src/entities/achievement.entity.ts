import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('achievements')
export class AchievementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ default: '' })
  iconUrl: string;

  @Column({ type: 'enum', enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' })
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @Column({ type: 'jsonb', default: {} })
  condition: Record<string, unknown>;
}
