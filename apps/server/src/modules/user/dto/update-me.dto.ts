import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MinLength(2)
  @MaxLength(20)
  username?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MaxLength(255)
  avatarUrl?: string;
}
