import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';

interface LinuxDoUserInfo {
  id: number;
  username: string;
  name: string;
  avatar_template: string;
  active: boolean;
  trust_level: number;
  silenced: boolean;
}

@Injectable()
export class LinuxDoOAuthService {
  private readonly logger = new Logger(LinuxDoOAuthService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authUrl = 'https://connect.linux.do/oauth2/authorize';
  private readonly tokenUrl = 'https://connect.linux.do/oauth2/token';
  private readonly userInfoUrl = 'https://connect.linux.do/api/user';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.clientId = this.config.get<string>('LINUXDO_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('LINUXDO_CLIENT_SECRET', '');
    this.redirectUri = this.config.get<string>('LINUXDO_REDIRECT_URI', '');
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  getAuthorizeUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'user',
    });
    return `${this.authUrl}?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<{ token: string; user: Record<string, unknown> }> {
    // 1. Exchange code for access token
    const tokenRes = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      this.logger.error(`LinuxDo token exchange failed: ${err}`);
      throw new BadRequestException('LinuxDo 授权失败，请重试');
    }

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new BadRequestException('LinuxDo 授权失败：未获取到 access_token');
    }

    // 2. Fetch user info
    const userRes = await fetch(this.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new BadRequestException('获取 LinuxDo 用户信息失败');
    }

    const linuxDoUser = await userRes.json() as LinuxDoUserInfo;
    this.logger.log(`LinuxDo user: id=${linuxDoUser.id} username=${linuxDoUser.username} trust=${linuxDoUser.trust_level}`);

    // 3. Find or create user
    let user = await this.userRepo.findOne({ where: { linuxdoId: linuxDoUser.id } });

    if (!user) {
      // Resolve username conflict
      let username = linuxDoUser.username || linuxDoUser.name || `ldo_${linuxDoUser.id}`;
      const existing = await this.userRepo.findOne({ where: { username } });
      if (existing) {
        username = `${username}_ldo`;
      }

      // Build avatar URL from template
      const avatarUrl = linuxDoUser.avatar_template
        ? linuxDoUser.avatar_template.replace('{size}', '240')
        : '';
      // If avatar_template is a relative URL, prepend linux.do domain
      const fullAvatarUrl = avatarUrl.startsWith('http')
        ? avatarUrl
        : avatarUrl ? `https://linux.do${avatarUrl}` : '';

      const adminEmail = this.config.get<string>('ADMIN_EMAIL');
      user = this.userRepo.create({
        linuxdoId: linuxDoUser.id,
        username,
        avatarUrl: fullAvatarUrl,
        email: null,
        passwordHash: null,
        authProvider: 'linuxdo',
        role: 'user',
      });

      await this.userRepo.save(user);
      this.logger.log(`Created LinuxDo user: ${user.id} (${username})`);
    } else {
      // Update avatar on each login
      if (linuxDoUser.avatar_template) {
        const avatarUrl = linuxDoUser.avatar_template.replace('{size}', '240');
        user.avatarUrl = avatarUrl.startsWith('http') ? avatarUrl : `https://linux.do${avatarUrl}`;
        await this.userRepo.save(user);
      }
    }

    // 4. Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }
}
