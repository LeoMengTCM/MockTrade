import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async updateMe(userId: string, updates: UpdateMeDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (updates.username && updates.username !== user.username) {
      const existingUser = await this.userRepo.findOne({ where: { username: updates.username } });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Username already taken');
      }
      user.username = updates.username;
    }

    if (typeof updates.avatarUrl === 'string') {
      user.avatarUrl = updates.avatarUrl;
    }

    await this.userRepo.save(user);
    return this.sanitize(user);
  }

  private sanitize(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
