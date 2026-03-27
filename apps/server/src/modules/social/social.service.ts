import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from '../../entities/follow.entity';
import { TradePostEntity } from '../../entities/trade-post.entity';
import { CommentEntity } from '../../entities/comment.entity';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(FollowEntity) private readonly followRepo: Repository<FollowEntity>,
    @InjectRepository(TradePostEntity) private readonly postRepo: Repository<TradePostEntity>,
    @InjectRepository(CommentEntity) private readonly commentRepo: Repository<CommentEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  // === Follow ===
  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) throw new BadRequestException('Cannot follow yourself');
    const exists = await this.followRepo.findOne({ where: { followerId, followingId } });
    if (exists) throw new BadRequestException('Already following');
    await this.followRepo.save(this.followRepo.create({ followerId, followingId }));
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.followRepo.delete({ followerId, followingId });
  }

  async getFollowing(userId: string) {
    const follows = await this.followRepo.find({ where: { followerId: userId } });
    const users = await Promise.all(follows.map(f => this.userRepo.findOne({ where: { id: f.followingId } })));
    return users.filter(Boolean).map(u => ({ id: u!.id, username: u!.username, avatarUrl: u!.avatarUrl }));
  }

  async getFollowers(userId: string) {
    const follows = await this.followRepo.find({ where: { followingId: userId } });
    const users = await Promise.all(follows.map(f => this.userRepo.findOne({ where: { id: f.followerId } })));
    return users.filter(Boolean).map(u => ({ id: u!.id, username: u!.username, avatarUrl: u!.avatarUrl }));
  }

  async getFollowStats(userId: string) {
    const following = await this.followRepo.count({ where: { followerId: userId } });
    const followers = await this.followRepo.count({ where: { followingId: userId } });
    return { following, followers };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const f = await this.followRepo.findOne({ where: { followerId, followingId } });
    return !!f;
  }

  // === Posts ===
  async createPost(userId: string, content: string, orderId?: string) {
    const post = this.postRepo.create({ userId, content, orderId: orderId || null });
    return this.postRepo.save(post);
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    // Get posts from people I follow + my own
    const following = await this.followRepo.find({ where: { followerId: userId } });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    const qb = this.postRepo.createQueryBuilder('p')
      .where('p.userId IN (:...ids)', { ids: followingIds })
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Enrich with user info
    const enriched = await Promise.all(items.map(async (post) => {
      const user = await this.userRepo.findOne({ where: { id: post.userId } });
      const commentCount = await this.commentRepo.count({ where: { postId: post.id } });
      return {
        ...post,
        username: user?.username || 'Unknown',
        avatarUrl: user?.avatarUrl || '',
        commentCount,
      };
    }));

    return { items: enriched, total, page, limit };
  }

  async getUserPosts(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.postRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { items, total, page, limit };
  }

  // === Comments ===
  async addComment(postId: string, userId: string, content: string) {
    const comment = this.commentRepo.create({ postId, userId, content });
    return this.commentRepo.save(comment);
  }

  async getComments(postId: string) {
    const comments = await this.commentRepo.find({ where: { postId }, order: { createdAt: 'ASC' } });
    return Promise.all(comments.map(async (c) => {
      const user = await this.userRepo.findOne({ where: { id: c.userId } });
      return { ...c, username: user?.username || 'Unknown', avatarUrl: user?.avatarUrl || '' };
    }));
  }
}
