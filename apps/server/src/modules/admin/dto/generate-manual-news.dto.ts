import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class GenerateManualNewsDto {
  @IsUUID()
  stockId: string;

  @IsIn(['positive', 'negative'])
  impact: 'positive' | 'negative';

  @Type(() => Number)
  @IsNumber()
  @Min(0.001, { message: '目标影响必须大于 0' })
  @Max(100, { message: '目标影响不能超过 100%' })
  impactPercent: number;

  @IsOptional()
  @IsIn(['neutral', 'breaking', 'funny'])
  style?: 'neutral' | 'breaking' | 'funny';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventHint?: string;

  @IsOptional()
  @IsBoolean()
  publishNow?: boolean;
}
