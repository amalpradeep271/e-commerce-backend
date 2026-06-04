import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ description: 'Target user ID (optional, omit for broadcast)', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Notification title', example: 'Summer Promo!' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification body content', example: 'Get 20% off all hoodies using coupon HOODIE20' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ description: 'Notification type', enum: ['order', 'promo', 'system'], example: 'promo' })
  @IsEnum(['order', 'promo', 'system'])
  @IsNotEmpty()
  type: string;
}
