import { Controller, Post, Get, Body, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LinuxDoOAuthService } from './linuxdo-oauth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@SkipThrottle()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly linuxDoOAuth: LinuxDoOAuthService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Get('linuxdo')
  linuxDoRedirect(@Res() res: Response) {
    if (!this.linuxDoOAuth.isConfigured()) {
      throw new BadRequestException('LinuxDo 登录未配置');
    }
    res.redirect(this.linuxDoOAuth.getAuthorizeUrl());
  }

  @Public()
  @Get('linuxdo/callback')
  async linuxDoCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('缺少授权码');
    }
    const result = await this.linuxDoOAuth.handleCallback(code);
    // Redirect to frontend callback page with token
    const userEncoded = encodeURIComponent(JSON.stringify(result.user));
    res.redirect(`/callback?token=${result.token}&user=${userEncoded}`);
  }

  @Public()
  @Get('linuxdo/status')
  linuxDoStatus() {
    return { enabled: this.linuxDoOAuth.isConfigured() };
  }
}
