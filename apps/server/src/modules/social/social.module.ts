import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowEntity } from '../../entities/follow.entity';
import { TradePostEntity } from '../../entities/trade-post.entity';
import { CommentEntity } from '../../entities/comment.entity';
import { UserEntity } from '../../entities/user.entity';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FollowEntity, TradePostEntity, CommentEntity, UserEntity])],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
