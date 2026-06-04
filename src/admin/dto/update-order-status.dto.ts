import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'Order status title', example: 'Shipped' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Is this status step done', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDone?: boolean;
}
