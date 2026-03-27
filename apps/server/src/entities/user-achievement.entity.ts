import {
  Entity, PrimaryColumn, CreateDateColumn,
} from 'typeorm';

@Entity('user_achievements')
export class UserAchievementEntity {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  achievementId: string;

  @CreateDateColumn()
  unlockedAt: Date;
}
