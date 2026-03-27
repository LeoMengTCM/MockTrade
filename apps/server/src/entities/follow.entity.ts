import {
  Entity, PrimaryColumn, CreateDateColumn, Unique,
} from 'typeorm';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class FollowEntity {
  @PrimaryColumn('uuid')
  followerId: string;

  @PrimaryColumn('uuid')
  followingId: string;

  @CreateDateColumn()
  createdAt: Date;
}
