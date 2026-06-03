import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReviewDto {
  @ApiProperty({ example: 'prod_01', description: 'Product custom string ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 4.5, description: 'Rating (1.0 to 5.0)' })
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  rating: number;

  @ApiProperty({ example: 'Excellent product!', description: 'Review title' })
  @IsString()
  @IsOptional()
  reviewTitle: string;

  @ApiProperty({ example: 'Really loved this product. High quality.', description: 'Review detailed content' })
  @IsString()
  @IsOptional()
  reviewContent: string;

  @ApiProperty({ example: 'John Doe', required: false, description: 'User full name (ignored by backend, read from auth)' })
  @IsString()
  @IsOptional()
  creatorName?: string;

  @ApiProperty({ example: 'http://img.url', required: false, description: 'User avatar (ignored by backend, read from auth)' })
  @IsString()
  @IsOptional()
  creatorImage?: string;

  @ApiProperty({ example: '2026-06-02T12:00:00.000Z', required: false, description: 'Created date string' })
  @IsString()
  @IsOptional()
  createdDate?: string;
}
