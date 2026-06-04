import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty({ description: 'Banner image URL', example: 'https://example.com/banner.jpg' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({ description: 'Discount description (e.g. 50% OFF)', example: '50% OFF' })
  @IsString()
  @IsNotEmpty()
  discountAmount: string;
}
