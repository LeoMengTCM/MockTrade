import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAISettingsDto {
  @IsIn(['openai', 'claude'])
  provider: 'openai' | 'claude';

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  apiBase: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model: string;

  @IsOptional()
  @IsBoolean()
  clearApiKey?: boolean;
}
