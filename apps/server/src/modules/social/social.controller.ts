import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('social')
@UseGuards(AuthGuard('jwt'))
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  follow(@CurrentUser('id') me: string, @Param('userId') targetId: string) {
    return this.socialService.follow(me, targetId);
  }

  @Delete('follow/:userId')
  unfollow(@CurrentUser('id') me: string, @Param('userId') targetId: string) {
    return this.socialService.unfollow(me, targetId);
  }

  @Get('following')
  getFollowing(@CurrentUser('id') userId: string) {
    return this.socialService.getFollowing(userId);
  }

  @Get('followers')
  getFollowers(@CurrentUser('id') userId: string) {
    return this.socialService.getFollowers(userId);
  }

  @Get('follow-stats/:userId')
  getFollowStats(@Param('userId') userId: string) {
    return this.socialService.getFollowStats(userId);
  }

  @Get('is-following/:userId')
  isFollowing(@CurrentUser('id') me: string, @Param('userId') targetId: string) {
    return this.socialService.isFollowing(me, targetId);
  }

  @Post('posts')
  createPost(@CurrentUser('id') userId: string, @Body() body: { content: string; orderId?: string }) {
    return this.socialService.createPost(userId, body.content, body.orderId);
  }

  @Get('feed')
  getFeed(@CurrentUser('id') userId: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.socialService.getFeed(userId, parseInt(page), parseInt(limit));
  }

  @Get('posts/user/:userId')
  getUserPosts(@Param('userId') userId: string, @Query('page') page = '1') {
    return this.socialService.getUserPosts(userId, parseInt(page));
  }

  @Post('posts/:postId/comments')
  addComment(@Param('postId') postId: string, @CurrentUser('id') userId: string, @Body() body: { content: string }) {
    return this.socialService.addComment(postId, userId, body.content);
  }

  @Get('posts/:postId/comments')
  getComments(@Param('postId') postId: string) {
    return this.socialService.getComments(postId);
  }
}
