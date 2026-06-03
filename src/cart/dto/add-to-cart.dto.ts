import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'prod_01', description: 'Product custom string ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'Running Shoes', description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  productTitle: string;

  @ApiProperty({ example: 2, description: 'Quantity chosen' })
  @IsNumber()
  prodctQuantity: number;

  @ApiProperty({ example: 'Red', description: 'Selected color' })
  @IsString()
  @IsNotEmpty()
  productColor: string;

  @ApiProperty({ example: 'M', description: 'Selected size' })
  @IsString()
  @IsNotEmpty()
  productSize: string;

  @ApiProperty({ example: 99.99, description: 'Product base price' })
  @IsNumber()
  productPrice: number;

  @ApiProperty({ example: 79.99, description: 'Product discount price' })
  @IsNumber()
  discountPrice: number;

  @ApiProperty({ example: 159.98, description: 'Total price for this item selection' })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ example: 'http://image.url', description: 'Product thumbnail image url' })
  @IsString()
  @IsNotEmpty()
  productImage: string;

  @ApiProperty({ example: '2026-06-02T12:00:00.000Z', description: 'Date added' })
  @IsString()
  @IsNotEmpty()
  createdDate: string;
}
