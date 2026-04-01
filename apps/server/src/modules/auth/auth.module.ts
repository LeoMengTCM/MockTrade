import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LinuxDoOAuthService } from './linuxdo-oauth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

const INSECURE_DEFAULTS = ['default-secret', 'change-me-in-production'];

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('AuthModule');
        const secret = config.get<string>('JWT_SECRET', 'default-secret');
        if (INSECURE_DEFAULTS.includes(secret)) {
          if (process.env.NODE_ENV === 'production') {
            logger.error('JWT_SECRET 未配置或使用了默认值，生产环境禁止启动');
            process.exit(1);
          }
          logger.warn('JWT_SECRET 使用了默认值，请在生产环境中设置安全密钥');
        }
        return { secret, signOptions: { expiresIn: '7d' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LinuxDoOAuthService, JwtStrategy],
  exports: [AuthService, LinuxDoOAuthService, JwtModule],
})
export class AuthModule {}
