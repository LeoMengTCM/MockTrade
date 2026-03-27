import { IsUUID, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  stockId: string;

  @IsEnum(['market', 'limit'])
  type: 'market' | 'limit';

  @IsEnum(['buy', 'sell'])
  side: 'buy' | 'sell';

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  price?: number; // required for limit orders
}
