export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: AchievementRarity;
  condition: Record<string, unknown>;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}
