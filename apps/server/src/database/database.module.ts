import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        database: config.get('DATABASE_NAME', 'mocktrade'),
        username: config.get('DATABASE_USER', 'postgres'),
        password: config.get('DATABASE_PASSWORD', 'postgres'),
        entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
        synchronize: config.get('DB_SYNC', 'true') === 'true',
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
