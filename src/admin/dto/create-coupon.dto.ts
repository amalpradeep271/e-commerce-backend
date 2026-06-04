import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code', example: 'SUMMER50' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Discount type (percentage or fixed)', enum: ['percentage', 'fixed'], example: 'percentage' })
  @IsEnum(['percentage', 'fixed'])
  @IsNotEmpty()
  discountType: string;

  @ApiProperty({ description: 'Discount value (percentage percentage value or fixed amount value)', example: 10 })
  @IsNumber()
  discountValue: number;

  @ApiProperty({ description: 'Minimum order amount to apply this coupon', example: 50, required: false })
  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @ApiProperty({ description: 'Maximum times this coupon can be used (null for unlimited)', example: 100, required: false })
  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @ApiProperty({ description: 'Coupon expiration date', example: '2026-12-31T23:59:59.999Z' })
  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;

  @ApiProperty({ description: 'Is coupon active', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
