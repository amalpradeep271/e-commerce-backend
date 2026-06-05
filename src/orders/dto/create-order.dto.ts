import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderedProductDto {
  @ApiProperty({ example: 'prod_01', description: 'Product custom string ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'Running Shoes', description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  productTitle: string;

  @ApiProperty({ example: 2, description: 'Quantity ordered' })
  @IsNumber()
  productQuantity: number;

  @ApiProperty({ example: 'Red', description: 'Selected color' })
  @IsString()
  @IsNotEmpty()
  productColor: string;

  @ApiProperty({ example: 'M', description: 'Selected size' })
  @IsString()
  @IsNotEmpty()
  productSize: string;

  @ApiProperty({ example: 99.99, description: 'Base price' })
  @IsNumber()
  productPrice: number;

  @ApiProperty({ example: 79.99, description: 'Discount price' })
  @IsNumber()
  discountPrice: number;

  @ApiProperty({ example: 159.98, description: 'Total price for this item' })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ example: 'http://image.url', description: 'Image url' })
  @IsString()
  @IsNotEmpty()
  productImage: string;

  @ApiProperty({
    example: '2026-06-02T12:00:00.000Z',
    description: 'Date created',
  })
  @IsString()
  @IsNotEmpty()
  createdDate: string;

  @ApiProperty({
    example: 'cart_item_uuid',
    description: 'Database ID of the corresponding cart item to clear',
  })
  @IsString()
  @IsNotEmpty()
  id: string; // Cart item ID
}

export class OrderStatusDto {
  @ApiProperty({ example: 'Order Placed', description: 'Status title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: '2026-06-02T12:00:00.000Z',
    description: 'Date of status update',
  })
  @IsString()
  @IsNotEmpty()
  createdDate: string;

  @ApiProperty({
    example: true,
    description: 'Whether this stage is completed',
  })
  @IsBoolean()
  done: boolean;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderedProductDto],
    description: 'List of products ordered',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderedProductDto)
  products: OrderedProductDto[];

  @ApiProperty({
    example: '2026-06-02T12:00:00.000Z',
    description: 'Order creation date',
  })
  @IsString()
  @IsNotEmpty()
  createdDate: string;

  @ApiProperty({
    example: '123 Main St, Springfield',
    description: 'Shipping delivery address',
  })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty({ example: 2, description: 'Total items count' })
  @IsNumber()
  itemCount: number;

  @ApiProperty({ example: 159.98, description: 'Total price of the order' })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ example: 'ORD-54321', description: 'Unique order code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    type: [OrderStatusDto],
    description: 'Order tracking status history',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderStatusDto)
  orderStatus: OrderStatusDto[];
}
