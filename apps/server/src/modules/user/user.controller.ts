import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.userService.getMe(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateMeDto,
  ) {
    return this.userService.updateMe(userId, body);
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }
}
