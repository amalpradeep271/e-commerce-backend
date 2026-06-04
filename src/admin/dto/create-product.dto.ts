import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ColorDto {
  @ApiProperty({ example: 'Black' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '#000000' })
  @IsString()
  @IsNotEmpty()
  hexCode: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Custom productId string mapping for the Flutter app', example: 'prod_15' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Category ID (UUID)', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Product title', example: 'Summer T-Shirt' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Product description', example: 'A lightweight and breathable cotton shirt' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Dimensions / Fit description', example: 'Regular Fit' })
  @IsString()
  @IsNotEmpty()
  dimensions: string;

  @ApiProperty({ description: 'Manufacturing information', example: '100% Cotton, Made in India' })
  @IsString()
  @IsNotEmpty()
  manufactureInformation: string;

  @ApiProperty({ description: 'Price', example: 29.99 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Discount price (set to 0.00 for no discount)', example: 19.99 })
  @IsNumber()
  discountPrice: number;

  @ApiProperty({ description: 'Gender category (0=Unisex, 1=Male, 2=Female)', example: 0 })
  @IsNumber()
  gender: number;

  @ApiProperty({ description: 'Sizes available', example: ['S', 'M', 'L'] })
  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  @ApiProperty({ description: 'Colors available', type: [ColorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorDto)
  colors: ColorDto[];

  @ApiProperty({ description: 'Image URLs (if already uploaded/seeded)', example: ['https://example.com/img1.jpg'] })
  @IsArray()
  @IsString({ each: true })
  images: string[];
}
