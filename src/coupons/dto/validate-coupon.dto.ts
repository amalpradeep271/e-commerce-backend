import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate', example: 'SUMMER50' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Order amount to check against minimum purchase requirement',
    example: 100,
  })
  @IsNumber()
  orderAmount: number;
}
